mod helpers;
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
            let app_version = app.package_info().version.to_string();

            let workspaces_root = app
                .path()
                .app_data_dir()
                .expect("app_data_dir")
                .join("vault-workspaces");

            app.manage(AppState {
                vault: VaultService::new(app_version, 1, workspaces_root),
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
            vault::commands::create_vault,
            vault::commands::load_vault,
            vault::commands::close_vault,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
