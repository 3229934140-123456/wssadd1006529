import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SceneSelect from "@/pages/SceneSelect";
import BillView from "@/pages/BillView";
import Reconcile from "@/pages/Reconcile";
import Feedback from "@/pages/Feedback";
import { Header } from "@/components/layout";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30">
        <Header />
        <main className="pb-24">
          <Routes>
            <Route path="/" element={<SceneSelect />} />
            <Route path="/scenes/:sceneId/bill" element={<BillView />} />
            <Route path="/scenes/:sceneId/reconcile" element={<Reconcile />} />
            <Route path="/scenes/:sceneId/feedback" element={<Feedback />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
