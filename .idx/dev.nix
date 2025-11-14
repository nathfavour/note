{pkgs}: {
  channel = "unstable";
  packages = [
    # pkgs.nodejs_24
    # pkgs.cargo
    # pkgs.rustup
    # pkgs.gcc
    pkgs.gh
    pkgs.bun

  ];
  idx.extensions = [
    
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}