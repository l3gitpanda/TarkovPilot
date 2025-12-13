using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Diagnostics;
using System.IO;
using Microsoft.Win32;
using System.Windows.Forms;

namespace TarkovPilot
{
    public static class Env
    {
        static Env()
        {
            FileVersionInfo versionInfo = FileVersionInfo.GetVersionInfo(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "TarkovPilot.exe"));
            //Logger.Log($"File version: {versionInfo.FileVersion}");

            Version = versionInfo.FileVersion;
        }

        // first logs read on app start
        //public static bool InitialLogsRead { get; set; } = true;

        public static string Version = "0.0";

        public static string WebsiteUrl = "http://localhost:5124/";

        public static string WebRoot => Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "web");


        private static string _gameFolder = null;
        public static string GameFolder
        {
            get
            {
                if (_gameFolder == null)
                {
                    string installPath = null;

                    RegistryKey key = Registry.LocalMachine.OpenSubKey("SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\EscapeFromTarkov");
                    installPath = key?.GetValue("InstallLocation")?.ToString();
                    key?.Dispose();

                    if (string.IsNullOrEmpty(installPath))
                    {
                        installPath = "C:\\Battlestate Games\\EFT"; // default path
                    }

                    _gameFolder = installPath;
                }

                return _gameFolder;
            }

            set { _gameFolder = value; }
        }

        public static string LogsFolder
        {
            get
            {
                try
                {
                    return Path.Combine(GameFolder, "Logs");
                }
                catch
                {
                    return null;
                }
            }
        }

        private static string _screenshotsFolder;
        public static string ScreenshotsFolder
        {
            get
            {
                if (_screenshotsFolder == null)
                {
                    _screenshotsFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "Escape from Tarkov", "Screenshots");
                }
                return _screenshotsFolder;
            }
            set { _screenshotsFolder = value; }
        }

        //===================== AppContext Settings ============================

        public static void SetSettings(AppSettings settings)
        {
            Env.GameFolder = settings.gameFolder;
            Env.ScreenshotsFolder = settings.screenshotsFolder;
        }

        public static AppSettings GetSettings()
        {
            AppSettings settings = new AppSettings()
            {
                gameFolder = Env.GameFolder,
                screenshotsFolder = Env.ScreenshotsFolder,
            };
            return settings;
        }

        public static void ResetSettings()
        {
            AppSettings settings = new AppSettings()
            {
                gameFolder = null,
                screenshotsFolder = null,
            };
            SetSettings(settings);
        }

        //===================== AppContext Settings ============================

        public static void RestartApp()
        {
            Application.Restart();
            Environment.Exit(0);
        }
    }
}
