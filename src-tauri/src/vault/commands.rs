use crate::state::AppState;
use crate::vault::errors::VaultError;
use crate::vault::types::VaultHandle;

use tauri::State;

#[tauri::command]
pub fn create_vault(state: State<AppState>, path: String) -> Result<VaultHandle, VaultError> {
    state.vault.create_vault(&path)?;
    state.vault.load_vault(&path)
}

#[tauri::command]
pub fn load_vault(state: State<AppState>, path: String) -> Result<VaultHandle, VaultError> {
    state.vault.load_vault(&path)
}

#[tauri::command]
pub fn close_vault(state: State<AppState>) -> Result<(), VaultError> {
    state.vault.close_vault()
}
