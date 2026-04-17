import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { Analytics } from "@/components/views/Analytics";
import { Ledger } from "@/components/views/Ledger";
import { Sandbox } from "@/components/views/Sandbox";
import { Notifications } from "@/components/views/Notifications";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Analytics />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/sandbox" element={<Sandbox />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
