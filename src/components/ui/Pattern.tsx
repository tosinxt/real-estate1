"use client";
import styled from "styled-components";

const StyledWrapper = styled.div`
  .pattern {
    width: 100%;
    height: 100%;

    --s: 170px;
    --c1: #1a4341;
    --c2: #4f807c;
    --c3: #356260;
    --thickness: 15px;

    background-color: var(--c1);
    background-image: repeating-linear-gradient(
        45deg,
        var(--c2) 0 var(--thickness),
        transparent var(--thickness) calc(var(--thickness) * 2)
      ),
      repeating-linear-gradient(
        -45deg,
        var(--c3) 0 var(--thickness),
        transparent var(--thickness) calc(var(--thickness) * 2)
      );
    background-size: var(--s) var(--s);
  }
`;

interface Props {
  className?: string;
  opacity?: number;
}

export function Pattern({ className = "", opacity = 1 }: Props) {
  return (
    <StyledWrapper className={`absolute inset-0 ${className}`} style={{ opacity }}>
      <div className="pattern" />
    </StyledWrapper>
  );
}
