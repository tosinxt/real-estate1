"use client";
import { useCallback, useState, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import styled from "styled-components";

const StyledWrapper = styled.div`
  .container {
    height: 188px;
    width: 100%;
    max-width: 100%;
    border-radius: 8px;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    gap: 4px;
    background-color: var(--upload-bg, #FAFAFA);
    border: 1px solid var(--upload-border, #E2E8F0);
    transition: box-shadow 0.15s, border-color 0.15s, background-color 0.25s;
  }

  .container.drag-active {
    border-color: #D97706;
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
    background-color: #FFFBEB;
  }

  .container.drag-error {
    border-color: #DC2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .header {
    flex: 1;
    width: 100%;
    border: 2px dashed var(--upload-border, #CBD5E1);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .header:hover {
    background: rgba(217, 119, 6, 0.04);
    border-color: #D97706;
  }

  .container.drag-active .header {
    background: rgba(217, 119, 6, 0.06);
    border-color: #D97706;
  }

  .container.drag-error .header {
    border-color: #DC2626;
  }

  .header svg {
    height: 48px;
  }

  .header p {
    text-align: center;
    color: var(--muted, #64748B);
    font-size: 12px;
    margin-top: 4px;
    padding: 0 12px;
    font-family: inherit;
    transition: color 0.25s;
  }

  .footer {
    background-color: var(--upload-footer-bg, #F1F5F9);
    width: 100%;
    height: 34px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: var(--muted, #64748B);
    border: 1px solid var(--upload-border, #E2E8F0);
    transition: background 0.15s, border-color 0.25s;
  }

  .footer:hover {
    background-color: var(--input-border, #E2E8F0);
  }

  .footer svg.file-icon {
    height: 130%;
    fill: #D97706;
    background-color: rgba(217, 119, 6, 0.08);
    border-radius: 50%;
    padding: 2px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .footer p {
    flex: 1;
    text-align: center;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 8px;
    color: var(--input-text, #475569);
    font-family: inherit;
    transition: color 0.25s;
  }

  #file {
    display: none;
  }
`;

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFile, disabled }: Props) {
  const [fileName, setFileName] = useState("Not selected file");
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (accepted: File[], fileRejections: FileRejection[]) => {
      setRejected(false);
      if (fileRejections.length > 0) {
        setRejected(true);
        setFileName("File type not supported");
        return;
      }
      if (accepted[0]) {
        setFileName(accepted[0].name);
        onFile(accepted[0]);
      }
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    disabled,
    noClick: true,
  });

  function handleFooterClick() {
    inputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFile(file);
    }
  }

  const containerClass = [
    "container",
    isDragActive && !isDragReject && !rejected ? "drag-active" : "",
    (isDragReject || rejected) ? "drag-error" : "",
  ].filter(Boolean).join(" ");

  return (
    <StyledWrapper>
      <div {...getRootProps()} className={containerClass}>
        <input {...getInputProps()} />

        <div className="header" onClick={() => inputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15"
              stroke={rejected ? "#DC2626" : "#D97706"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>
            {isDragActive && !isDragReject
              ? "Drop it here!"
              : rejected
              ? "Only PDF, JPG, PNG under 20MB"
              : "Browse file to upload"}
          </p>
        </div>

        <label className="footer" onClick={handleFooterClick}>
          <svg className="file-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.331 6H8.5v20h15V14.154h-8.169z" />
            <path d="M18.153 6h-.009v5.342H23.5v-.002z" />
          </svg>
          <p>{fileName}</p>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: "16px", width: "16px", flexShrink: 0, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setFileName("Not selected file");
              setRejected(false);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="#94A3B8" strokeWidth={2} />
            <path d="M19.5 5H4.5" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" />
            <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="#94A3B8" strokeWidth={2} />
          </svg>
        </label>

        <input
          ref={inputRef}
          id="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    </StyledWrapper>
  );
}
