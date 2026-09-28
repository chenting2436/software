package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SaveSolution writes an exported customer solution to a user-selected JSON file.
func (a *App) SaveSolution(content string, suggestedName string) (string, error) {
	if strings.TrimSpace(suggestedName) == "" {
		suggestedName = "矿大-土行孙V2-方案配置.json"
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "导出客户方案配置",
		DefaultFilename: suggestedName,
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON 配置文件", Pattern: "*.json"},
		},
	})
	if err != nil || path == "" {
		return path, err
	}
	if filepath.Ext(path) == "" {
		path += ".json"
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return "", err
	}
	return path, nil
}

// SaveExport saves a demo report, CSV table or JSON snapshot through a native dialog.
func (a *App) SaveExport(content string, suggestedName string) (string, error) {
	ext := strings.ToLower(filepath.Ext(suggestedName))
	if ext != ".json" && ext != ".csv" && ext != ".html" {
		ext = ".json"
		suggestedName = "矿大-演示导出.json"
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title: "导出演示资料", DefaultFilename: filepath.Base(suggestedName),
		Filters: []runtime.FileFilter{{DisplayName: strings.ToUpper(ext[1:]) + " 文件", Pattern: "*" + ext}},
	})
	if err != nil || path == "" {
		return path, err
	}
	if filepath.Ext(path) == "" {
		path += ext
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return "", err
	}
	return path, nil
}
