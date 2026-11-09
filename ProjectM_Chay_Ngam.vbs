' =================================================================
' ProjectM - Trình khởi động ứng dụng Chạy ngầm (Không hiện cửa sổ đen)
' =================================================================
Set WshShell = CreateObject("WScript.Shell")
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
strCurrentDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = strCurrentDir

' 1. Khởi chạy máy chủ Vite qua start-server.mjs ở chế độ ẩn hoàn toàn (0 = Ẩn)
WshShell.Run "node """ & strCurrentDir & "\start-server.mjs""", 0, False

' 2. Đợi máy chủ sẵn sàng
WScript.Sleep 2500

' 3. Mở ứng dụng bằng Chrome ở chế độ App Mode (không thanh địa chỉ)
Dim chromePath
chromePath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")
If Not fso.FileExists(chromePath) Then
  chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
End If
If Not fso.FileExists(chromePath) Then
  chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
End If

If fso.FileExists(chromePath) Then
  WshShell.Run """" & chromePath & """ --app=http://localhost:3030", 1, False
Else
  WshShell.Run "http://localhost:3030"
End If
