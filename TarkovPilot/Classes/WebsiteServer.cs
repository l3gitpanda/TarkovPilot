using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TarkovPilot
{
    public static class WebsiteServer
    {
        private static HttpListener _listener;
        private static CancellationTokenSource _cancelSource;

        static WebsiteServer()
        {
            System.Windows.Forms.Application.ApplicationExit += (object sender, EventArgs e) => Stop();
        }

        public static string Url => Env.WebsiteUrl;

        public static void Start()
        {
            try
            {
                Stop();

                if (!HttpListener.IsSupported)
                {
                    Logger.Log("Website server not supported on this platform");
                    return;
                }

                if (!Directory.Exists(Env.WebRoot))
                {
                    Directory.CreateDirectory(Env.WebRoot);
                }

                _listener = new HttpListener();
                _listener.Prefixes.Add(Env.WebsiteUrl);
                _listener.Start();

                _cancelSource = new CancellationTokenSource();
                Task.Run(() => ListenLoop(_cancelSource.Token));

                Logger.Log($"Website server started at {Env.WebsiteUrl}");
            }
            catch (HttpListenerException ex)
            {
                Logger.Log($"Website server failed to start: {ex.Message}");
            }
        }

        public static void Stop()
        {
            try
            {
                _cancelSource?.Cancel();
                _listener?.Stop();
                _listener?.Close();
            }
            catch (ObjectDisposedException) { }
            finally
            {
                _cancelSource = null;
                _listener = null;
            }
        }

        private static async Task ListenLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested && _listener != null)
            {
                try
                {
                    var context = await _listener.GetContextAsync();
                    _ = Task.Run(() => HandleRequest(context));
                }
                catch (Exception ex)
                {
                    if (!token.IsCancellationRequested)
                    {
                        Logger.Log($"Website server loop error: {ex.Message}");
                    }
                }
            }
        }

        private static void HandleRequest(HttpListenerContext context)
        {
            try
            {
                var path = context.Request.Url.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(path))
                {
                    path = "index.html";
                }

                path = path.Replace('/', Path.DirectorySeparatorChar);
                var requestedPath = Path.GetFullPath(Path.Combine(Env.WebRoot, path));
                var rootPath = Path.GetFullPath(Env.WebRoot);

                if (Directory.Exists(requestedPath))
                {
                    requestedPath = Path.Combine(requestedPath, "index.html");
                }

                if (!requestedPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase) || !File.Exists(requestedPath))
                {
                    WriteResponse(context, 404, "text/plain", "Not Found");
                    return;
                }

                var buffer = File.ReadAllBytes(requestedPath);
                WriteResponse(context, 200, GetContentType(requestedPath), buffer);
            }
            catch (Exception ex)
            {
                Logger.Log($"Website server request error: {ex.Message}");
                try
                {
                    WriteResponse(context, 500, "text/plain", "Internal Server Error");
                }
                catch { }
            }
        }

        private static void WriteResponse(HttpListenerContext context, int statusCode, string contentType, string message)
        {
            var bytes = Encoding.UTF8.GetBytes(message);
            WriteResponse(context, statusCode, contentType, bytes);
        }

        private static void WriteResponse(HttpListenerContext context, int statusCode, string contentType, byte[] data)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = contentType;
            context.Response.ContentLength64 = data.Length;
            context.Response.OutputStream.Write(data, 0, data.Length);
            context.Response.OutputStream.Close();
        }

        private static string GetContentType(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            switch (extension)
            {
                case ".html": return "text/html";
                case ".css": return "text/css";
                case ".js": return "application/javascript";
                case ".json": return "application/json";
                case ".svg": return "image/svg+xml";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".ico": return "image/x-icon";
                default: return "application/octet-stream";
            }
        }
    }
}
