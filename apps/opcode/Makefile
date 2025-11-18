restart-process:
	kill -9 $(pgrep -f "opcode")
	sleep 1
	cargo build --manifest-path=src-tauri/Cargo.toml