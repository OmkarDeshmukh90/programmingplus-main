import React from "react";

export default function Layout({ children }) {
  return (
    <div className="app-page">
      <main className="app-shell pt-24 pb-12">
        {children}
      </main>
    </div>
  );
}
