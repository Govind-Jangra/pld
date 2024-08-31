import { useState } from 'react';
import './App.css';

function App() {
    const [file, setFile] = useState(null);
    const [downloadLink, setDownloadLink] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setDownloadLink(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            setDownloadLink(result.filePath);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async () => {
        if (!downloadLink) return;

        setIsDownloading(true);

        try {
            const response = await fetch(`http://localhost:5000${downloadLink}`, {
                method: 'GET',
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', downloadLink.split('/').pop()); 
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url); 
            } else {
                console.error('Failed to download file.');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
        } finally {
            setIsDownloading(false);
            setDownloadLink(null); 
        }
    };

    return (
        <div className="app-container">
            <h1 className="app-title">Excel File Processor</h1>
            <form className="file-upload" onSubmit={(e) => e.preventDefault()}>
                <input
                    type="file"
                    id="fileInput"
                    onChange={handleFileChange}
                    className="file-input"
                    aria-label="File Input"
                />
                <label htmlFor="fileInput" className="file-label">
                    {file ? file.name : 'Choose an Excel file'}
                </label>
                <button
                    onClick={handleUpload}
                    className="upload-button"
                    disabled={!file || isUploading}
                    aria-label="Upload Button"
                >
                    {isUploading ? 'Uploading...' : 'Upload and Process'}
                </button>
            </form>
            {isUploading && <div className="upload-status" aria-live="polite">Uploading your file...</div>}
            {downloadLink && (
                <div className="download-section">
                    <button
                        onClick={handleDownload}
                        className="download-button"
                        disabled={isDownloading}
                        aria-label="Download Button"
                    >
                        {isDownloading ? 'Downloading...' : 'Download Processed File'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;
