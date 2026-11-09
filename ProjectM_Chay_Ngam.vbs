' =================================================================
' ProjectM - Trình khởi động ứng dụng Chạy ngầm (Không hiện Terminal)
' =================================================================
Set WshShell = CreateObject("WScript.Shell")
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
strCurrentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Khởi chạy máy chủ Vite ở chế độ ẩn hoàn toàn (0 = Ẩn cửa sổ)
WshShell.CurrentDirectory = strCurrentDir
WshShell.Run "cmd.exe /c npm run dev", 0, False

' 2. Đợi 2 giây để server sẵn sàng rồi tự động mở ứng dụng
WScript.Sleep 2000

Dim chromePath
chromePath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")
If fso.FileExists(chromePath) Then
  WshShell.Run """" & chromePath & """ --app=http://localhost:3030", 1, False
Else
  WshShell.Run "http://localhost:3030"
End If

