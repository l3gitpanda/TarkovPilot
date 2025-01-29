using System;
using System.IO;

namespace TarkovPilot
{
    public static class ScreenshotsWatcher
    {
        static FileSystemWatcher screenshotsWatcher;

        public static void Start()
        {
            if (!Directory.Exists(Env.ScreenshotsFolder))
            {
                Logger.Log($"Watcher: screenshots folder not found: '{Env.ScreenshotsFolder}'");
                return;
            }
            
            Logger.Log($"Watcher: monitoring screenshots folder: '{Env.ScreenshotsFolder}'");

            screenshotsWatcher = new FileSystemWatcher(Env.ScreenshotsFolder);
            screenshotsWatcher.Created += OnScreenshot;
            screenshotsWatcher.EnableRaisingEvents = true;
        }

        public static void Stop()
        {
            if (screenshotsWatcher != null)
            {
                screenshotsWatcher.Created -= OnScreenshot;
                screenshotsWatcher.Dispose();
                screenshotsWatcher = null;                
            }
        }

        public static void Restart()
        {
            Stop();
            Start();
        }

        static void OnScreenshot(object sender, FileSystemEventArgs e)
        {
            try
            {
                string filename = e.Name ?? "";
                //Logger.Log($"Watcher:OnScreenshot {filename}");
                if (!string.IsNullOrEmpty(filename))
                {
                    Server.SendFilename(filename);
                }
            }
            catch (Exception ex)
            {
                Logger.Log($"Watcher:OnScreenshot err; {ex.Message}");
            }
        }
    }
}
