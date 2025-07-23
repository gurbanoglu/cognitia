The .python-version file is there to guarantee that the
correct Python version is used for running Django.
This file cannot contain comments!


From the cognitia directory, execute the following command
in a terminal window to launch the application:

docker compose up --build

docker compose up builds (if needed), creates, starts,
and attaches to containers defined in your docker-compose.yml
file.

--build:
Builds images for your services before starting the
containers, ensuring any changes in your Dockerfiles
or dependencies are included.

Local:
http://localhost:5173/

This URL uses localhost, which is a hostname that
refers to the local machine itself (your own
computer). When you access this URL, your browser
connects to a development server running on your
own machine.

Network:
http://172.20.0.4:5173/

This URL uses an IP address on a local network (a
private IP in the 172.20.0.4 range), which means
the development server is accessible over the local
network to other devices connected to the same network.

This allows other team members or devices to access
the running development server remotely, which is
useful for collaborative testing or previewing on
different devices.