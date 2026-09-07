import Foundation

enum APIError: LocalizedError, Equatable {
    case unavailable, http(Int), invalidContent, oversized, unsupportedVersion, network
    var errorDescription: String? {
        switch self {
        case .unavailable: "La création personnalisée est fermée pour le moment."
        case .http: "Le service ne répond pas comme prévu. Le carnet enregistré dans l’app reste disponible."
        case .invalidContent, .unsupportedVersion, .oversized: "La réponse reçue ne peut pas être ouverte. Le carnet inclus reste disponible."
        case .network: "Connexion indisponible. Tu peux continuer à lire et préparer ton brouillon hors ligne."
        }
    }
}

struct APIClient: Sendable {
    let baseURL: URL
    let session: URLSession
    init(baseURL: URL = URL(string: "https://monflorian.com")!, session: URLSession? = nil) {
        self.baseURL = baseURL
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 15
        configuration.timeoutIntervalForResource = 25
        configuration.httpCookieStorage = nil
        configuration.urlCache = nil
        self.session = session ?? URLSession(configuration: configuration)
    }
    func configuration() async throws -> APIConfiguration {
        do {
            let config: APIConfiguration = try await get(APIContract.configurationPath, maximumBytes: 16384)
            guard config.apiVersion == "v1" else { throw APIError.unsupportedVersion }
            return config
        } catch APIError.http(404) {
            // Only a missing versioned route permits a read-only legacy fallback.
            let legacy: LegacyAPIConfiguration = try await get("api/config", maximumBytes: 16384)
            return legacy.readOnlyConfiguration
        }
    }
    func example() async throws -> PublicExample {
        let example: PublicExample = try await get(APIContract.japanExamplePath, maximumBytes: 262144)
        return try example.validated()
    }
    private func get<T: Decodable>(_ path: String, maximumBytes: Int) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        do {
            let (bytes, response) = try await session.bytes(for: request)
            guard let http = response as? HTTPURLResponse else { throw APIError.invalidContent }
            guard http.statusCode == 200 else { throw APIError.http(http.statusCode) }
            guard http.url?.host == baseURL.host, http.mimeType == "application/json" else { throw APIError.invalidContent }
            guard response.expectedContentLength <= maximumBytes else { throw APIError.oversized }
            var data = Data()
            for try await byte in bytes {
                guard data.count < maximumBytes else { throw APIError.oversized }
                data.append(byte)
            }
            return try JSONDecoder().decode(T.self, from: data)
        } catch let error as APIError { throw error }
        catch is DecodingError { throw APIError.invalidContent }
        catch is CancellationError { throw CancellationError() }
        catch { throw APIError.network }
    }
}
