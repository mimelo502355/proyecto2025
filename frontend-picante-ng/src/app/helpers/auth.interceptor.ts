import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const userJson = localStorage.getItem('user');
    let token = null;

    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            token = user.accessToken;
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
        }
    }

    if (token) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(authReq);
    }

    return next(req);
};
