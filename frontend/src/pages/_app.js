import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/globals.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navbar />                   
        <div className="pt-3">      
          <Component {...pageProps} />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
