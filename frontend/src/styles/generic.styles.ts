import styled, { css } from 'styled-components'

export const Animatable = css`
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    text-shadow 0.3s ease,
    filter 0.3s ease;
`

export const Button = styled.button<{ type?: 'primary' | 'secondary' | 'gray'; width?: string }>`
  padding: 0 20px;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: 5px;
  cursor: pointer;
  outline: none;
  border: none;

  /* background-color: ${({ type, theme }) => (type === 'primary' ? theme.primary : theme.secondary)}; */
  ${({ type, theme }) => {
    switch (type) {
      case 'primary':
        return css`
          background-color: ${theme.primary};
          color: ${theme.tertiary};
        `
      case 'secondary':
        return css`
          background-color: ${theme.secondary};
          color: ${theme.tertiary};
        `
      case 'gray':
        return css`
          background-color: ${theme.gray};
          color: ${theme.tertiary};
        `
      default:
        return css`
          background-color: ${theme.primary};
          color: ${theme.tertiary};
        `
    }
  }}

  &:disabled {
    opacity: 0.5;
  }

  color: ${({ theme }) => theme.tertiary};

  width: ${({ width }) => width || 'auto'};

  ${Animatable}
`

export const MenuButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  margin: 0;
  width: 40px;
  height: 40px;
  color: ${({ theme }) => theme.tertiary};

  svg {
    width: 24px;
    height: 24px;
  }
`
