use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_http::init())
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
