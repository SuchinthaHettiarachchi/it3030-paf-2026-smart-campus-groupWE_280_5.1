@echo off
echo Adding Windows Firewall rule for SmartCampus Backend (Port 8080)...
netsh advfirewall firewall add rule name="SmartCampus Backend - Port 8080" dir=in action=allow protocol=TCP localport=8080
echo.
echo Firewall rule added successfully!
echo Your backend is now accessible from the network.
echo.
pause
