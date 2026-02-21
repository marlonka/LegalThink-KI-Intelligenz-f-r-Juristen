import React, { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { fetchDemoFile } from '../../utils/demoUtils';
import { DemoFileParams } from '../../types';

interface DemoLoadButtonProps {
    demoFile: DemoFileParams;
    onLoad: (file: File) => void;
    label?: string;
}

const DemoLoadButton: React.FC<DemoLoadButtonProps> = ({ demoFile, onLoad, label = "Musterakte für diesen Test laden" }) => {
    const { state } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);

    if (!state.isDemoMode) {
        return null;
    }

    const handleLoadDemo = async () => {
        setIsLoading(true);
        try {
            const file = await fetchDemoFile(demoFile.path, demoFile.name);
            onLoad(file);
        } catch (error) {
            console.error("Failed to load demo file", error);
            alert("Fehler beim Laden der Musterakte. Bitte Console prüfen.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-4 flex justify-center animate-enter">
            <button
                onClick={handleLoadDemo}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200 text-amber-800 border border-amber-200/50 rounded-xl font-medium text-sm transition-all duration-300 shadow-sm hover:shadow group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <Loader size={16} className="animate-spin text-amber-600" />
                ) : (
                    <Sparkles size={16} className="text-amber-500 group-hover:text-amber-600 group-hover:animate-pulse" />
                )}
                {label}
            </button>
        </div>
    );
};

export default DemoLoadButton;
