import styled from 'styled-components'

export const AppContainer = styled.div`
  min-height: 100svh;
  width: 100vw;
  background-color: ${({ theme }) => theme.tertiary};
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.text};
`
