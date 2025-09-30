
import { JSEncrypt } from 'jsencrypt';

const publicKey: string = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6mDxtXnT/kMPXfYLJaO7
vtuuIMwixTSbmRBBShR8WuivXeYzJ5SirEARd6ivzJUXhkxJGGGU+pOmVDahGdY2
qf/Usvux9/t0yyqzzGBpzR1RMiTmeKqAh18+JZnpWakyJEub26tr9KIRaiFljCrD
UkdhzOLoMAyXkaBFC7E4kQ0dLF8gLfPDg2bM9AxGwSNqaVN7DNCajpvK6kXa/iwQ
f8ryiy2sKC/jcjBNnmF7FQ7LXy8w4TxeCu1eTA6h5OGpMw6jhPLDrlidMo7DX07H
irKI26el66/S00/KC8MtAZbIY52uRDeC4ghxCbmIlT9tvMiwNzxR8GBbZCCU72Gg
swIDAQAB
-----END PUBLIC KEY-----
`;

// 将字符串使用 RSA 加密
export const encrypt = (data: string): string => {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(publicKey);
    return encryptor.encrypt(data) || '';
};


