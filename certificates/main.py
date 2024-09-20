import subprocess
import shlex
from pathlib import Path
from os import getenv
from typing import Optional, Union


dest = Path("./data")


def call_command(command: str):
    process = subprocess.Popen(
        shlex.split(command),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    stdout, _ = process.communicate(timeout=5)
    return process.returncode, stdout


def generate_ca(config: Union[str, Path], duration: int = 365):
    commands = [
        (
            f"openssl genrsa -out {dest / 'ca.key'} 4096",
            "Failed to generate a Private Key for the CA",
        ),
        (
            f"openssl req -x509 -new -nodes -key {dest / 'ca.key'} -sha256 -days {duration} -out {dest / 'ca.crt'} -config {config}",
            "Failed to create a Self-Signed Root CA Certificate",
        ),
    ]

    for command, error_message in commands:
        return_code, stdout = call_command(command)
        if return_code != 0:
            raise Exception(f"{error_message}: \n{stdout}")


def generate_client_certificate(
    name: str, config: Union[str, Path], duration: int = 365, extensions: str = ""
):
    if not (dest / "ca.key").exists() or not (dest / "ca.crt").exists():
        raise Exception("Missing CA key or cert.")

    commands = [
        (
            f"openssl genrsa -out {dest / f'{name}.key'} 4096",
            f"Failed to generate a Private Key for '{name}'",
        ),
        (
            f"openssl req -new -key {dest / f'{name}.key'} -days {duration} -out {dest / f'{name}.csr'} -config {config}",
            f"Failed to create the CSR for '{name}'",
        ),
        (
            f"openssl x509 -req -in {dest / f'{name}.csr'} -CA {dest / 'ca.crt'} -CAkey {dest / 'ca.key'} -CAcreateserial -out {dest / f'{name}.crt'} -days {duration} -sha256 -extfile {config} -extensions {extensions}",
            f"Failed so sign the CSR from '{name}' with the CA certificate",
        ),
    ]

    for command, error_message in commands:
        return_code, stdout = call_command(command)
        if return_code != 0:
            raise Exception(f"{error_message}: \n{stdout.decode()}")


def main():
    generate_ca(getenv("CA_CONFIGURATION", "./openssl-san_ca.cnf"))
    generate_client_certificate(
        "server",
        getenv("SERVER_CONFIGURATION", "./openssl-san_server.cnf"),
        extensions="req_ext",
    )
    generate_client_certificate(
        "client",
        getenv("CLIENT_CONFIGURATION", "./openssl-san_client.cnf"),
        extensions="v3_req",
    )


if __name__ == "__main__":
    main()
