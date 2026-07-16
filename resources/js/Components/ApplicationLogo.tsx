import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo(
    props: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>,
) {
    return <img {...props} src="/images/Logo.png" alt="I.S.E Libertad" />;
}
