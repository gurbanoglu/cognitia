from daphne.cli import CommandLineInterface

def run():
  CommandLineInterface().run([
    "-b", "0.0.0.0",
    "-p", "8000",
    "backend.asgi:application",
    "--proxy-headers",
    "--verbosity", "2"
  ])

if __name__ == "__main__":
  run()