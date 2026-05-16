import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import AppShell from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <Card className="w-full max-w-md mx-auto text-center shadow-lg border-border">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">404</CardTitle>
            <CardDescription className="text-lg">Page not found</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="default" className="gap-2">
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
