import subprocess

for pkg in ["playwright", "selenium"]:
    try:
        __import__(pkg)
        print(f"{pkg} is installed")
    except ImportError:
        print(f"{pkg} is NOT installed")
