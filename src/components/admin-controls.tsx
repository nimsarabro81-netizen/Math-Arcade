
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Trash2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

interface AdminControlsProps {
    collectionName: string;
    leaderboardName: string;
}

export function AdminControls({ collectionName, leaderboardName }: AdminControlsProps) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isClearing, setIsClearing] = useState(false);

    const handleClearLeaderboard = async () => {
        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Firestore is not available.',
            });
            return;
        }

        setIsClearing(true);
        const ranksRef = collection(firestore, collectionName);

        try {
            const querySnapshot = await getDocs(ranksRef);

            if (querySnapshot.empty) {
                toast({
                    title: `${leaderboardName} is already empty.`,
                });
                setIsClearing(false);
                return;
            }

            // Delete documents one by one for more robust error handling
            const deletePromises = querySnapshot.docs.map(document => {
                const docRef = doc(firestore, collectionName, document.id);
                return deleteDoc(docRef).catch(error => {
                    // Emit a specific error for each failed deletion
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'delete',
                    }));
                    // Throw the error to be caught by the outer catch block
                    throw new Error(`Failed to delete document: ${document.id}`);
                });
            });

            await Promise.all(deletePromises);

            toast({
                title: 'Success!',
                description: `The ${leaderboardName} has been cleared.`,
            });
            // Force a refresh to show the cleared leaderboard
            window.location.reload();

        } catch (error) {
            console.error("Error clearing leaderboard: ", error);
            // A general error toast will be shown if any deletion fails
            toast({
                variant: 'destructive',
                title: 'Error Clearing Leaderboard',
                description: 'Could not clear all scores. Check permissions and try again.',
            });
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: ranksRef.path,
                operation: 'list', // The initial getDocs might be the issue
            }));
        } finally {
            setIsClearing(false);
        }
    };
    
    const handleRefresh = () => {
        window.location.reload();
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{leaderboardName} Actions</CardTitle>
                <CardDescription>Use these controls to manage the {leaderboardName}.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleRefresh}>
                    <RefreshCw className="mr-2" /> Refresh Leaderboard
                </Button>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2" /> Clear Leaderboard
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete all scores from the {leaderboardName}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearLeaderboard} disabled={isClearing}>
                                {isClearing ? "Clearing..." : "Yes, clear it"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
