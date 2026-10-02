-- Faits de recherche privés, chiffrés séparément du carnet final.
ALTER TABLE trips ADD COLUMN research_ciphertext BLOB;
ALTER TABLE trips ADD COLUMN research_nonce BLOB;
