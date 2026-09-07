import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

func check(_ condition: @autoclosure () -> Bool, _ message: String) throws {
    if !condition() { throw NSError(domain: "PhotoContract", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let source = try Data(contentsOf: input)
let prepared = try PhotoPreparer.prepare(source)
try check(prepared.data.count <= 1_500_000, "Encoded photo exceeds API limit")
try check(prepared.image.width >= 256 && prepared.image.height >= 256, "Photo below minimum dimensions")
try check(prepared.image.width <= 2048 && prepared.image.height <= 2048, "Photo above maximum dimensions")
try prepared.data.write(to: output)

// Only synthetic metadata is attached to an existing fictional portrait.
let tagged = NSMutableData()
let writer = CGImageDestinationCreateWithData(tagged, UTType.jpeg.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(writer, prepared.image, [
    kCGImagePropertyExifDictionary: [kCGImagePropertyExifUserComment: "synthetic-private-marker"],
    kCGImagePropertyGPSDictionary: [kCGImagePropertyGPSLatitude: 0, kCGImagePropertyGPSLatitudeRef: "N"],
    kCGImagePropertyOrientation: 6
] as CFDictionary)
try check(CGImageDestinationFinalize(writer), "Unable to make synthetic source")
let cleaned = try PhotoPreparer.prepare(tagged as Data)
let cleanedSource = CGImageSourceCreateWithData(cleaned.data as CFData, nil)!
let properties = CGImageSourceCopyPropertiesAtIndex(cleanedSource, 0, nil)! as NSDictionary
try check(properties[kCGImagePropertyGPSDictionary] == nil, "GPS metadata retained")
try check(properties[kCGImagePropertyExifDictionary] == nil, "EXIF metadata retained")
try check(cleaned.data.range(of: Data("synthetic-private-marker".utf8)) == nil, "Private marker retained")

do {
    _ = try PhotoPreparer.prepare(Data("not-an-image".utf8))
    throw NSError(domain: "PhotoContract", code: 2)
} catch PhotoPreparationError.unreadable {}

let small = CGContext(data: nil, width: 128, height: 128, bitsPerComponent: 8, bytesPerRow: 0,
                      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
let smallData = NSMutableData()
let smallWriter = CGImageDestinationCreateWithData(smallData, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(smallWriter, small.makeImage()!, nil)
try check(CGImageDestinationFinalize(smallWriter), "Unable to make small source")
do {
    _ = try PhotoPreparer.prepare(smallData as Data)
    throw NSError(domain: "PhotoContract", code: 3)
} catch PhotoPreparationError.tooSmall {}
print("Photo preparation passed: PNG size, dimensions, EXIF removal, unreadable and undersized input")
