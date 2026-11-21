use tauri::Emitter;
use keyring::Entry;

#[tauri::command]
fn save_credential(service: String, key: String, value: String) -> Result<(), String> {
  let entry = Entry::new(&service, &key).map_err(|e| e.to_string())?;
  entry.set_password(&value).map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
fn get_credential(service: String, key: String) -> Result<Option<String>, String> {
  let entry = Entry::new(&service, &key).map_err(|e| e.to_string())?;
  match entry.get_password() {
    Ok(pwd) => Ok(Some(pwd)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(e) => Err(e.to_string()),
  }
}

#[tauri::command]
fn delete_credential(service: String, key: String) -> Result<(), String> {
  let entry = Entry::new(&service, &key).map_err(|e| e.to_string())?;
  match entry.delete_credential() {
    Ok(_) => Ok(()),
    Err(keyring::Error::NoEntry) => Ok(()),
    Err(e) => Err(e.to_string()),
  }
}

#[tauri::command]
fn is_keychain_available() -> bool {
  Entry::new("ai.yourway.fox.test", "probe").is_ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_http::init())
    .invoke_handler(tauri::generate_handler![
      save_credential,
      get_credential,
      delete_credential,
      is_keychain_available
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Detect file passed via command line argument or Finder open
      let args: Vec<String> = std::env::args().collect();
      if args.len() > 1 {
        let file_path = args[1].clone();
        if file_path.ends_with(".md") || file_path.ends_with(".markdown") {
          let handle = app.handle().clone();
          std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(600));
            let _ = handle.emit("open-file", file_path);
          });
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_keychain_lifecycle() {
    let service = "ai.yourway.fox.test".to_string();
    let key = format!("unit_test_key_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
    let val = "sk-test-secret-value-xyz".to_string();

    // Clean up first
    let _ = delete_credential(service.clone(), key.clone());

    // Save
    let save_res = save_credential(service.clone(), key.clone(), val.clone());
    assert!(save_res.is_ok(), "save_credential failed: {:?}", save_res);

    // Get
    let get_res = get_credential(service.clone(), key.clone());
    assert_eq!(get_res, Ok(Some(val.clone())));

    // Delete
    let del_res = delete_credential(service.clone(), key.clone());
    assert!(del_res.is_ok(), "delete_credential failed: {:?}", del_res);

    // Get after delete should be Ok(None)
    let get_res2 = get_credential(service.clone(), key.clone());
    assert_eq!(get_res2, Ok(None));
  }
}

