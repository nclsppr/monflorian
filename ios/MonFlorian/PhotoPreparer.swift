import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

struct PreparedPhoto {
    let data: Data
    let image: CGImage
}

enum PhotoPreparationError: LocalizedError {
    case unreadable, tooLarge, tooSmall

    var errorDescription: String? {
        switch self {
        case .unreadable: "Cette image ne peut pas être ouverte. Choisis une autre photo."
        case .tooLarge: "Cette photo dépasse les limites de préparation. Choisis une image plus légère."
        case .tooSmall: "Chaque côté de la photo doit mesurer au moins 256 pixels. Choisis une image moins recadrée."
        }
    }
}

/// Produces the PNG accepted by the shared API, without retaining source metadata.
enum PhotoPreparer {
    static let maximumSourceBytes = 30_000_000
    static let maximumEncodedBytes = 1_500_000
    static let minimumEdge = 256

    static func prepare(_ source: Data) throws -> PreparedPhoto {
        guard source.count <= maximumSourceBytes else { throw PhotoPreparationError.tooLarge }
        guard let imageSource = CGImageSourceCreateWithData(source as CFData, [
            kCGImageSourceShouldCache: false
        ] as CFDictionary), CGImageSourceGetCount(imageSource) > 0,
              let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [CFString: Any],
              let width = properties[kCGImagePropertyPixelWidth] as? Int,
              let height = properties[kCGImagePropertyPixelHeight] as? Int,
              width > 0, height > 0 else { throw PhotoPreparationError.unreadable }
        guard width >= minimumEdge, height >= minimumEdge else { throw PhotoPreparationError.tooSmall }
        // Bound thumbnail decoding even for unusually large compressed images.
        guard width <= 32_768, height <= 32_768,
              Int64(width) * Int64(height) <= 100_000_000 else { throw PhotoPreparationError.tooLarge }

        for edge in [2048, 1536, 1280, 1024, 896, 768, 640, 512, 384, 256] {
            guard let thumbnail = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceThumbnailMaxPixelSize: edge,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceShouldCacheImmediately: true
            ] as CFDictionary) else { throw PhotoPreparationError.unreadable }
            guard thumbnail.width >= minimumEdge, thumbnail.height >= minimumEdge else {
                throw PhotoPreparationError.tooSmall
            }
            // Drawing into a fresh 8-bit RGB bitmap normalizes orientation and color.
            // Neither EXIF, location, source thumbnails nor text chunks are copied.
            guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
                  let context = CGContext(data: nil, width: thumbnail.width, height: thumbnail.height,
                                          bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
                                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
                throw PhotoPreparationError.unreadable
            }
            context.draw(thumbnail, in: CGRect(x: 0, y: 0, width: thumbnail.width, height: thumbnail.height))
            guard let rendered = context.makeImage() else { throw PhotoPreparationError.unreadable }
            let output = NSMutableData()
            guard let destination = CGImageDestinationCreateWithData(output, UTType.png.identifier as CFString, 1, nil) else {
                throw PhotoPreparationError.unreadable
            }
            CGImageDestinationAddImage(destination, rendered, [:] as CFDictionary)
            guard CGImageDestinationFinalize(destination) else { throw PhotoPreparationError.unreadable }
            // ImageIO can add its own eXIf chunk even for a fresh bitmap.
            // Keep only pixel and standard color chunks from this generated PNG.
            let data = try pixelPNG(output as Data)
            if data.count <= maximumEncodedBytes {
                guard data.count >= 1024 else { throw PhotoPreparationError.unreadable }
                return PreparedPhoto(data: data, image: rendered)
            }
        }
        throw PhotoPreparationError.tooLarge
    }

    private static func pixelPNG(_ data: Data) throws -> Data {
        let signature = Data([137, 80, 78, 71, 13, 10, 26, 10])
        guard data.starts(with: signature) else { throw PhotoPreparationError.unreadable }
        let allowed: Set<String> = ["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "sRGB", "gAMA", "cHRM"]
        var result = signature
        var offset = 8
        while offset + 12 <= data.count {
            let length = (0..<4).reduce(0) { ($0 << 8) | Int(data[offset + $1]) }
            let end = offset + 12 + length
            guard end <= data.count,
                  let type = String(data: data[(offset + 4)..<(offset + 8)], encoding: .ascii) else {
                throw PhotoPreparationError.unreadable
            }
            if allowed.contains(type) { result.append(data[offset..<end]) }
            offset = end
            if type == "IEND" {
                guard length == 0, offset == data.count else { throw PhotoPreparationError.unreadable }
                return result
            }
        }
        throw PhotoPreparationError.unreadable
    }
}
