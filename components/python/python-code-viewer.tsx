'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    Play, 
    Edit3, 
    Check, 
    X, 
    Copy, 
    Download,
    AlertTriangle,
    Code2
} from 'lucide-react';
import { toast } from 'sonner';
import type { PythonCode } from '@/lib/types/python';

interface PythonCodeViewerProps {
    code: PythonCode;
    onExecute?: (code: string) => void;
    onCodeChange?: (code: string) => void;
    isExecuting?: boolean;
    canEdit?: boolean;
    showExecuteButton?: boolean;
    className?: string;
}

export function PythonCodeViewer({
    code,
    onExecute,
    onCodeChange,
    isExecuting = false,
    canEdit = true,
    showExecuteButton = true,
    className = ''
}: PythonCodeViewerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedCode, setEditedCode] = useState(code.code);

    const handleEdit = useCallback(() => {
        setIsEditing(true);
        setEditedCode(code.code);
    }, [code.code]);

    const handleSave = useCallback(() => {
        setIsEditing(false);
        onCodeChange?.(editedCode);
        toast.success('Code updated successfully');
    }, [editedCode, onCodeChange]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setEditedCode(code.code);
    }, [code.code]);

    const handleExecute = useCallback(() => {
        const codeToExecute = isEditing ? editedCode : code.code;
        onExecute?.(codeToExecute);
    }, [isEditing, editedCode, code.code, onExecute]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code.code);
            toast.success('Code copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy code');
        }
    }, [code.code]);

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Code2 className="h-5 w-5" />
                        Python Code
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge>
                            <span className="capitalize">{code.status}</span>
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            title="Copy code"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="bg-gray-900 rounded-md overflow-hidden">
                    {isEditing ? (
                        <textarea
                            value={editedCode}
                            onChange={(e) => setEditedCode(e.target.value)}
                            className="w-full h-64 p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none border-none outline-none"
                        />
                    ) : (
                        <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
                            <code className="language-python">{code.code}</code>
                        </pre>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleSave}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Save
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEdit}
                                    >
                                        <Edit3 className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                )}
                            </>
                        )}
                    </div>

                    {showExecuteButton && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleExecute}
                            disabled={isExecuting}
                        >
                            <Play className="h-4 w-4 mr-1" />
                            {isExecuting ? 'Executing...' : 'Execute'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}