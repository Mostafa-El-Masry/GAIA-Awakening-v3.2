"use client";

import React, { useCallback, useRef, useState } from "react";
import type { ApolloData } from "../lib/types";
import { saveData } from "../lib/store";
import styles from "./ArchiveFullView.module.css";

export default function ArchiveFullView({
  data,
  onClose,
}: {
  data: ApolloData;
  onClose?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // small visual feedback could be added; keeping simple
    } catch {}
  }, []);

  const handleExportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apollo-archives.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-label="Apollo full archives"
    >
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1 className={styles.title}>Apollo — Full Archives</h1>
          <p className={styles.subtitle}>
            All topics, sections and saved blocks — full width view.
          </p>
        </div>
        <div className={styles.controls}>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMessage(null);
              try {
                const txt = await f.text();
                const parsed = JSON.parse(txt) as unknown;
                // basic validation
                if (
                  !parsed ||
                  typeof parsed !== "object" ||
                  !Array.isArray((parsed as any).topics)
                ) {
                  setMessage("Invalid archive format: missing topics array.");
                  return;
                }
                // Save and notify user
                saveData(parsed as ApolloData);
                setMessage("Imported archives successfully. Refresh to apply.");
              } catch (err: any) {
                setMessage(
                  "Failed to import: " + (err?.message || String(err))
                );
              } finally {
                // clear input so same file can be selected again if needed
                if (fileRef.current) fileRef.current.value = "";
              }
            }}
          />
          <button
            className={styles.btn}
            onClick={() => fileRef.current?.click()}
            title="Import JSON"
          >
            Import JSON
          </button>
          <button
            className={styles.btn}
            onClick={handleExportJSON}
            title="Export JSON"
          >
            Export JSON
          </button>
          <button
            className={styles.btn}
            onClick={() => {
              if (onClose) onClose();
            }}
            title="Close view"
          >
            Close
          </button>
        </div>
      </header>

      <main className={styles.content}>
        {message && (
          <div
            style={{
              marginBottom: 12,
              color: message.startsWith("Failed") ? "#b91c1c" : "#065f46",
            }}
          >
            {message}
            {message ===
              "Imported archives successfully. Refresh to apply." && (
              <>
                {" "}
                <button
                  onClick={() => location.reload()}
                  style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 8 }}
                >
                  Refresh now
                </button>
              </>
            )}
          </div>
        )}
        {data.topics.length === 0 ? (
          <div className={styles.empty}>No archives saved.</div>
        ) : (
          data.topics.map((topic) => (
            <section key={topic.id} className={styles.topic}>
              <h2 className={styles.topicTitle}>{topic.title}</h2>

              {topic.sections.length === 0 ? (
                <div className={styles.emptySection}>No sections</div>
              ) : (
                topic.sections.map((section) => (
                  <article key={section.id} className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>{section.heading}</h3>
                      <div className={styles.sectionMeta}>
                        {new Date(section.editedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className={styles.blocks}>
                      {section.blocks.map((blk, i) => (
                        <div key={i} className={styles.blockRow}>
                          <pre className={styles.block}>{blk}</pre>
                          <div className={styles.blockActions}>
                            <button
                              className={styles.smallBtn}
                              onClick={() => handleCopy(blk)}
                              title="Copy block"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </section>
          ))
        )}
      </main>
    </div>
  );
}
