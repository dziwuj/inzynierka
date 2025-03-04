import { createGlobalStyle } from 'styled-components'
import { Animatable } from './generic.styles'

export const GlobalStyles = createGlobalStyle`
*, *::before, *::after{
    box-sizing: border-box;
    flex-direction: column;
    user-select: none;

    ${Animatable}
}

*{
    margin: 0; 
    padding: 0; 
}

ul[role='list'], ol[role='list']{
    list-style: none; 
}

html:focus-within{
    scroll-behavior: smooth; 
}

a:not([class]){
    text-decoration-skip-ink: auto; 
}

img, picture, svg, video, canvas{
    max-width: 100%;
    height: auto; 
    vertical-align: middle; 
    font-style: italic; 
    background-repeat: no-repeat; 
    background-size: cover;
}

input, button, textarea, select{
    font: inherit; 
}

@media (prefers-reduced-motion: reduce){
    html:focus-within {
        scroll-behavior: auto;
    }
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
        transition: none;
    }
}

body, html{
    height: 100%;
    scroll-behavior: smooth;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: ${({ theme }) => theme.text};
    background-color: ${({ theme }) => theme.tetiary};
    user-select: none;
}
`
