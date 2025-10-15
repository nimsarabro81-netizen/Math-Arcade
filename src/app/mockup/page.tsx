
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ball } from '@/components/ball';
import { Award, ChevronLeft, ChevronRight, RotateCw, Repeat } from 'lucide-react';
import Link from 'next/link';

export default function MockupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <Link href="/">
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
              VectorZen
            </h1>
          </Link>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            A playful game to master integers. This is a static mockup.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Main Game Card */}
            <Card className="w-full shadow-xl overflow-hidden border-primary/10">
              <CardHeader className="p-4 border-b">
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" aria-label="Previous Level">
                      <ChevronLeft />
                    </Button>
                    <div className="text-center px-4">
                      <p className="text-sm font-medium text-muted-foreground">Level 1</p>
                      <p className="font-mono text-2xl sm:text-3xl font-bold">5 - 8</p>
                    </div>
                    <Button variant="outline" size="icon" aria-label="Next Level">
                      <ChevronRight />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                     <Button variant="outline" className="h-12">
                        <Repeat className="mr-2 h-4 w-4"/> Flip Sign
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Reset Level" className="border">
                      <RotateCw />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="relative min-h-[300px] md:min-h-[400px] bg-grid p-6 flex flex-wrap gap-4 items-center justify-center">
                  {/* Positive Balls */}
                  <Ball type="positive" size="full" state="idle" />
                  <Ball type="positive" size="full" state="idle" />
                  <Ball type="positive" size="full" state="idle" />
                  <Ball type="positive" size="full" state="idle" />
                  <Ball type="positive" size="full" state="idle" selected />

                  {/* Negative Balls */}
                  <Ball type="negative" size="full" state="idle" />
                  <Ball type="negative" size="full" state="idle" />
                  <Ball type="negative" size="full" state="idle" />
                  <Ball type="negative" size="full" state="idle" />
                  <Ball type="negative" size="full" state="idle" />
                  <Ball type="negative" size="full" state="idle" />
                  <Ball type="negative" size="full" state="idle" selected />
                  <Ball type="negative" size="full" state="idle" />
                </div>
              </CardContent>

              <CardFooter className="flex justify-center items-center text-center bg-muted/30 p-4 border-t">
                <form className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Your Answer"
                    className="text-center text-lg h-12"
                    defaultValue="-3"
                  />
                  <Button type="submit" className="h-12">
                    Submit
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Score Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">Score</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="font-mono text-5xl font-bold">85</p>
                </CardContent>
             </Card>

            {/* Leaderboard Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-center font-headline text-3xl font-bold">
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold text-lg"><div className="flex items-center justify-center"><Award className="w-6 h-6 text-yellow-500" /></div></TableCell>
                      <TableCell>PlayerOne</TableCell>
                      <TableCell className="text-right font-mono font-bold">152</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold text-lg"><div className="flex items-center justify-center"><Award className="w-6 h-6 text-gray-400" /></div></TableCell>
                      <TableCell>ZenMaster</TableCell>
                      <TableCell className="text-right font-mono font-bold">140</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold text-lg"><div className="flex items-center justify-center"><Award className="w-6 h-6 text-yellow-700" /></div></TableCell>
                      <TableCell>IntegerPro</TableCell>
                      <TableCell className="text-right font-mono font-bold">133</TableCell>
                    </TableRow>
                     <TableRow>
                      <TableCell><div className="flex items-center justify-center text-muted-foreground">4</div></TableCell>
                      <TableCell>VectorVictor</TableCell>
                      <TableCell className="text-right font-mono font-bold">110</TableCell>
                    </TableRow>
                     <TableRow>
                      <TableCell><div className="flex items-center justify-center text-muted-foreground">5</div></TableCell>
                      <TableCell>Anonymous</TableCell>
                      <TableCell className="text-right font-mono font-bold">98</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
