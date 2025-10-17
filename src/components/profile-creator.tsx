
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

const boyNames = ['Leo', 'Sam', 'Ethan', 'Jack', 'Finn'];
const girlNames = ['Mia', 'Chloe', 'Ruby', 'Zara', 'Nora'];
const allNames = [...boyNames, ...girlNames];

const avatars = allNames.map(name => `https://i.pravatar.cc/150?u=${name}`);

interface ProfileCreatorProps {
  onProfileCreated: (username: string, avatar: string) => void;
}

export function ProfileCreator({ onProfileCreated }: ProfileCreatorProps) {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const isUsernameUnique = async (name: string): Promise<boolean> => {
    if (!firestore) return false;
    const collections = ['userRanks', 'algebraRanks', 'equationRanks'];
    const nameLower = name.toLowerCase();

    for (const col of collections) {
      const q = query(collection(firestore, col), where('username', '==', nameLower));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return false;
      }
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!username.trim() || username.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Invalid Username',
        description: 'Username must be at least 3 characters long.',
      });
      return;
    }
    
    setIsLoading(true);
    const isUnique = await isUsernameUnique(username);
    setIsLoading(false);

    if (!isUnique) {
      toast({
        variant: 'destructive',
        title: 'Username Taken',
        description: 'This username is already in use. Please choose another one.',
      });
      return;
    }

    onProfileCreated(username, selectedAvatar);
    toast({
      title: 'Profile Created!',
      description: `Welcome, ${username}!`,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto animate-fade-in shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline">Make Your Profile</CardTitle>
        <CardDescription>Choose a unique username and an avatar to represent you on the leaderboards.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-base">Username</Label>
          <Input
            id="username"
            placeholder="Your cool username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-12 text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base">Choose Your Avatar</Label>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            {avatars.map((src) => (
              <Avatar
                key={src}
                className={cn(
                  'h-16 w-16 cursor-pointer transition-all duration-200 hover:scale-110',
                  selectedAvatar === src && 'ring-4 ring-primary ring-offset-2'
                )}
                onClick={() => setSelectedAvatar(src)}
              >
                <AvatarImage src={src} alt={`Avatar ${src}`} />
                <AvatarFallback>{src.slice(-5, -4)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full h-12 text-lg">
          {isLoading ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <Check className="mr-2 h-6 w-6" />
          )}
          Save Profile & Start Playing
        </Button>
      </CardFooter>
    </Card>
  );
}
