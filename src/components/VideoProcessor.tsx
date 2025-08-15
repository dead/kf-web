import React, { useState, useCallback, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  Upload,
  Download,
  AlertCircle,
  Video,
  CheckCircle,
  Loader2,
  FileVideo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProcessingStatus {
  isLoading: boolean;
  isProcessing: boolean;
  progress: number;
  message: string;
}

const VideoProcessor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [logContent, setLogContent] = useState<string>("");
  const [status, setStatus] = useState<ProcessingStatus>({
    isLoading: false,
    isProcessing: false,
    progress: 0,
    message: "",
  });
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [threads, setThreads] = useState<number>(4);
  const [scenecut, setScenecut] = useState<number>(40);

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegLoaded) return;

    setStatus((prev) => ({
      ...prev,
      isLoading: true,
      message: "Loading FFmpeg...",
    }));

    try {
      const ffmpeg = new FFmpeg();

      ffmpeg.on("log", ({ message }) => {
        console.log(message);
        setStatus((prev) => ({ ...prev, message: message }));
      });

      ffmpeg.on("progress", ({ progress }) => {
        setStatus((prev) => ({
          ...prev,
          progress: Math.round(progress * 100),
        }));
      });

      const baseURL = `https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/esm`;

      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
        workerURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.worker.js`,
          "text/javascript"
        ),
      });

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        message: "FFmpeg loaded successfully!",
      }));
    } catch (error) {
      console.error("Error loading FFmpeg:", error);
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        message: `Error loading FFmpeg: ${error}`,
      }));
    }
  }, [ffmpegLoaded]);

  // Auto-load FFmpeg when component mounts
  useEffect(() => {
    loadFFmpeg();
  }, [loadFFmpeg]);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const videoFile = droppedFiles.find((file) =>
      file.type.startsWith("video/mp4")
    );

    if (videoFile) {
      setFile(videoFile);
      setLogContent("");
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && selectedFile.type.startsWith("video/mp4")) {
        setFile(selectedFile);
        setLogContent("");
      }
    },
    []
  );

  const processVideo = useCallback(async () => {
    if (!file || !ffmpegRef.current) return;

    setStatus((prev) => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      message: "Starting video processing...",
    }));

    try {
      const ffmpeg = ffmpegRef.current;

      // Write the input file to FFmpeg's virtual file system
      await ffmpeg.writeFile("input.mp4", await fetchFile(file));

      // Run the FFmpeg command you specified
      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-threads",
        threads.toString(),
        "-an",
        "-c:v",
        "libx264",
        "-preset:v",
        "ultrafast",
        "-tune",
        "animation",
        "-x264-params",
        `keyint=infinite:scenecut=${scenecut}:pass=1:stats=file.log`,
        "-f",
        "null",
        "-",
      ]);

      // Read the log file
      try {
        const logData = await ffmpeg.readFile("file.log");
        let logText: string;

        if (typeof logData === "string") {
          logText = logData;
        } else {
          logText = new TextDecoder().decode(logData as Uint8Array);
        }

        setLogContent(logText);
        setStatus((prev) => ({
          ...prev,
          isProcessing: false,
          message: "Video processing completed successfully!",
        }));
      } catch (logError) {
        console.error("Error reading log file:", logError);
        setLogContent("Log file not found or empty.");
        setStatus((prev) => ({
          ...prev,
          isProcessing: false,
          message: "Processing completed but log file could not be read.",
        }));
      }
    } catch (error) {
      console.error("Error processing video:", error);
      setStatus((prev) => ({
        ...prev,
        isProcessing: false,
        message: `Error processing video: ${error}`,
      }));
    }
  }, [file, threads, scenecut]);

  const downloadLog = useCallback(() => {
    if (!logContent) return;

    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name || "video"}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logContent, file?.name]);

  // Auto-process video when file is selected and FFmpeg is loaded
  useEffect(() => {
    if (file && ffmpegLoaded && !status.isProcessing && !logContent) {
      const autoProcess = async () => {
        await processVideo();
      };
      autoProcess();
    }
  }, [file, ffmpegLoaded, status.isProcessing, logContent, processVideo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <Video className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Keyframe Processor
            </h1>
          </div>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Use <code>ffmpeg</code> and <code>x264</code> to process your videos
            and extract keyframes.
          </p>
        </div>

        {/* FFmpeg Loading Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  ffmpegLoaded ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                {ffmpegLoaded ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Loader2
                    className={`h-6 w-6 text-blue-600 ${
                      status.isLoading ? "animate-spin" : ""
                    }`}
                  />
                )}
              </div>
              <div>
                <CardTitle className="text-xl">FFmpeg Status</CardTitle>
                <CardDescription className="text-base">
                  FFmpeg WebAssembly is loading automatically for video
                  processing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!ffmpegLoaded && (
                <Button
                  onClick={loadFFmpeg}
                  disabled={status.isLoading || ffmpegLoaded}
                  className={`w-full h-12 text-lg font-semibold transition-all duration-200 ${
                    ffmpegLoaded
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } ${status.isLoading ? "animate-pulse" : ""}`}
                >
                  {status.isLoading && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  {status.isLoading
                    ? "Loading FFmpeg..."
                    : "Retry Loading FFmpeg"}
                </Button>
              )}

              {ffmpegLoaded && (
                <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <span className="text-green-800 font-semibold">
                    FFmpeg Ready!
                  </span>
                </div>
              )}

              {status.message && (
                <div className="text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 animate-fade-in">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                    {status.message}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-indigo-100">
                <Video className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Processing Configuration
                </CardTitle>
                <CardDescription className="text-base">
                  Adjust FFmpeg processing parameters
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Threads Configuration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Number of Threads
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={threads}
                    onChange={(e) => setThreads(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    disabled={status.isProcessing}
                  />
                  <span className="min-w-[3rem] text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {threads}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Higher values may process faster but use more CPU
                </p>
              </div>

              {/* Scenecut Configuration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Scene Cut Threshold
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={scenecut}
                    onChange={(e) => setScenecut(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    disabled={status.isProcessing}
                  />
                  <span className="min-w-[3rem] text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    {scenecut}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Controls scene change detection sensitivity (0 = disabled)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Select Video</CardTitle>
                <CardDescription className="text-base">
                  Drag and drop an MP4 file or click to select
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                file
                  ? "border-green-300 bg-green-50 hover:bg-green-100"
                  : "border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400"
              }`}
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-4">
                  <FileVideo className="mx-auto h-16 w-16 text-green-600" />
                  <div>
                    <p className="text-xl font-semibold text-green-800">
                      {file.name}
                    </p>
                    <p className="text-green-600 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  {status.isProcessing ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-200 text-orange-800">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Processing video... {status.progress}%
                    </div>
                  ) : logContent ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-200 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Processing complete
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-200 text-blue-800">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Starting processing...
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="mx-auto h-16 w-16 text-purple-400" />
                  <div>
                    <p className="text-xl font-semibold text-gray-700">
                      Drop your MP4 file here, or click to browse
                    </p>
                    <p className="text-gray-500 mt-2">
                      Only MP4 files are supported
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Log Display Card */}
        {logContent && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Keyframes</CardTitle>
                  <CardDescription className="text-base">
                    FFmpeg keyframes statistics
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-green-400 p-6 rounded-xl font-mono text-sm max-h-96 overflow-auto border border-gray-700 shadow-inner">
                  <div className="flex items-center mb-3 pb-3 border-b border-gray-700">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="ml-4 text-gray-400 text-xs">
                      Keyframes Output
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {logContent}
                  </pre>
                </div>
                <Button
                  onClick={downloadLog}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Keyframes File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {status.message.includes("Error") && (
          <Card className="border-0 shadow-xl bg-red-50/80 backdrop-blur-sm border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">
                    Processing Error
                  </h3>
                  <p className="text-red-600 text-sm">
                    Something went wrong during video processing
                  </p>
                </div>
              </div>
              <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-mono text-sm">
                  {status.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200/50">
          <p className="text-gray-500 text-sm">
            Powered by{" "}
            <span className="font-semibold text-blue-600">
              FFmpeg WebAssembly
            </span>{" "}
            • Built with React & Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoProcessor;
