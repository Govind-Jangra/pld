import { useState } from 'react';
import './App.css';

function App() {
    const [file, setFile] = useState(null);
    const [downloadLink, setDownloadLink] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [processedData, setProcessedData] = useState([]);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setDownloadLink(null);
        setProcessedData([]);
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${import.meta.env.VITE_VARIABLE_NAME}/upload`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            setDownloadLink(result.filePath);
            setProcessedData(result.aggregatedData);
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
            const response = await fetch(`${import.meta.env.VITE_VARIABLE_NAME}${downloadLink}`, {
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

    const handleStartOver = () => {
        setFile(null);
        setDownloadLink(null);
        setProcessedData([]);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-cover bg-center" style={{ 
            backgroundImage: "url('https://png.pngtree.com/thumb_back/fh260/background/20230415/pngtree-website-technology-line-dark-background-image_2344719.jpg')", 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            width: '100%',
            overflow: 'auto'
        }}>
            <h1 className="text-3xl font-bold mb-8 text-white">PLD Contract Maker</h1>
            {!processedData.length && (
                <form className="w-full max-w-sm mb-4" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="file"
                        id="fileInput"
                        onChange={handleFileChange}
                        className="hidden"
                        aria-label="File Input"
                    />
                    <label htmlFor="fileInput" className="block w-full text-center py-2 px-4 bg-white border border-gray-300 rounded cursor-pointer">
                        {file ? file.name : 'Choose an Excel file'}
                    </label>
                    <button
                        onClick={handleUpload}
                        className={`mt-4 w-full py-2 px-4 bg-blue-500 text-white rounded ${!file || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                        disabled={!file || isUploading}
                        aria-label="Upload Button"
                    >
                        {isUploading ? 'Uploading...' : 'Upload and Process'}
                    </button>
                </form>
            )}

            {processedData.length > 0 && (
                <>
                    <div className="w-full max-w-sm mb-4">
                        <button
                            onClick={handleDownload}
                            className={`w-full py-2 px-4 bg-green-500 text-white rounded ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
                            disabled={isDownloading}
                            aria-label="Download Button"
                        >
                            {isDownloading ? 'Downloading...' : 'Download Processed File'}
                        </button>
                    </div>
                    <div className="w-full max-w-sm mb-4">
                        <button
                            onClick={handleStartOver}
                            className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
                            aria-label="Start Over Button"
                        >
                            Start Over
                        </button>
                    </div>
                    <div className="w-full max-w-4xl overflow-x-auto">
                        <h2 className="text-xl font-semibold mb-4 text-white">PLD Contract</h2>
                        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                            <thead className="bg-gray-800 text-white">
                                <tr>
                                    <th className="py-3 px-6 text-left border-b">Class Service</th>
                                    <th className="py-3 px-6 text-left border-b">Zone</th>
                                    <th className="py-3 px-6 text-left border-b">Weight (lb)</th>
                                    <th className="py-3 px-6 text-left border-b">Original Amount Paid</th>
                                    <th className="py-3 px-6 text-left border-b">Discount Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                                        <td className="py-2 px-6 border-b hover:bg-gray-200 transition duration-200">{row['Class Service']}</td>
                                        <td className="py-2 px-6 border-b hover:bg-gray-200 transition duration-200">{row['Zone']}</td>
                                        <td className="py-2 px-6 border-b hover:bg-gray-200 transition duration-200">{row['Weight (lb)']}</td>
                                        <td className="py-2 px-6 border-b hover:bg-gray-200 transition duration-200">{row['Original Amount Paid']}</td>
                                        <td className="py-2 px-6 border-b hover:bg-gray-200 transition duration-200">{row['Discount Percentage']}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
