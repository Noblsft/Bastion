use crate::vault::vault_service::VaultService;

/// Shared application state managed by Tauri.
/// Add new services here as fields as the app grows.
pub struct AppState {
    pub vault: VaultService,
}
