{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    # Toolchain fallback so better-sqlite3 can compile from source if a
    # prebuilt binary is unavailable for the runtime's Node ABI.
    pkgs.python3
    pkgs.gnumake
    pkgs.gcc
  ];
}
