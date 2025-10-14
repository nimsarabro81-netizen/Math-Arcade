"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Trash2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';


export function AdminControls() {
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
        try {
            const userRanksRef = collection(firestore, 'userRanks');
            const querySnapshot = await getDocs(userRanksRef);
            
            if (querySnapshot.empty) {
                toast({
                    title: 'Leaderboard is already empty.',
                });
                setIsClearing(false);
                return;
            }

            const batch = writeBatch(firestore);
            querySnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            toast({
                title: 'Success!',
                description: 'The leaderboard has been cleared.',
            });
        } catch (error: any) {
            console.error("Error clearing leaderboard: ", error);
            toast({
                variant: 'destructive',
                title: 'Something went wrong.',
                description: 'Could not clear the leaderboard. Check console for details.',
            });
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
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Use these controls to manage the leaderboard.</CardDescription>
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
                                This action cannot be undone. This will permanently delete all scores from the leaderboard.
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
