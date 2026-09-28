package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
)

func main() {
	executable, err := os.Executable()
	if err != nil {
		log.Fatal(err)
	}
	root := filepath.Join(filepath.Dir(executable), "web")
	if _, err := os.Stat(filepath.Join(root, "index.html")); err != nil {
		log.Fatalf("未找到大屏资源：%s", root)
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	address := listener.Addr().(*net.TCPAddr)
	url := fmt.Sprintf("http://127.0.0.1:%d/#dashboard", address.Port)

	server := &http.Server{
		ReadHeaderTimeout: 5 * time.Second,
		Handler: http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
			requested := filepath.Clean(filepath.Join(root, filepath.FromSlash(request.URL.Path)))
			if request.URL.Path == "/" {
				requested = filepath.Join(root, "index.html")
			}
			if info, statErr := os.Stat(requested); statErr == nil && !info.IsDir() {
				http.ServeFile(response, request, requested)
				return
			}
			http.ServeFile(response, request, filepath.Join(root, "index.html"))
		}),
	}

	go func() {
		time.Sleep(350 * time.Millisecond)
		command := exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
		command.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		_ = command.Start()
	}()

	if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
