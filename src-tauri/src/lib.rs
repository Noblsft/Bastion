mod state;
mod vault;

use state::AppState;
use vault::vault_service::VaultService;

use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(AppState {
                vault: VaultService::new(1),
            });
            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { .. } | WindowEvent::Destroyed => {
                if let Some(state) = window.app_handle().try_state::<AppState>() {
                    let _ = state.vault.close_vault();
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            // Lifecycle
            vault::commands::create_vault,
            vault::commands::open_vault,
            vault::commands::close_vault,
            // Files
            vault::commands::vault_create_file,
            vault::commands::vault_read_file,
            vault::commands::vault_update_file,
            vault::commands::vault_delete_file,
            vault::commands::vault_list_files,
            vault::commands::vault_search_files,
            // Settings
            vault::commands::vault_get_settings,
            vault::commands::vault_set_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
