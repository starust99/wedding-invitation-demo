# Rule xung ho khi sinh loi moi rieng

File nay khoa cach hieu cac cum xung ho trong Excel mau. Khi sua logic xung ho, phai chay `npm run check:guest-copy` de dam bao khong bi lech vai ve.

## Cong thuc chung

```text
TRAN TRONG & THAN MOI
<cum xung ho + ten khach> den du Thanh Le Hon Phoi & tiec cuoi cua <chu the phu hop>.
```

## Khi ba me dung moi

### Khach la be tren cua ba me

Chu the phai la:

```text
hai chau Nhat & Phuong
```

Ap dung cho cac cum trong Excel:

- Ong ba, Bo me, Ba me, Bo, Me, Ba
- Bac, Vo chong bac, Gia dinh bac
- Co, Gia dinh co
- Chu, Gia dinh chu
- Co chu, Gia dinh co chu
- Duong, Co duong, Gia dinh co duong
- Thim, Gia dinh thim, Gia dinh chu thim
- Di, Gia dinh di
- Cau, Gia dinh cau
- Cau mo, Gia dinh cau mo
- Mo, Gia dinh mo

Vi du:

```text
Gia dinh Di Sau den du Thanh Le Hon Phoi & tiec cuoi cua hai chau Nhat & Phuong.
```

### Khach ngang hang ba me hoac khach cua ba me

Chu the phai la:

```text
con chung toi
```

Ap dung cho cac cum:

- Ban
- Hai ban
- Vo chong ban
- Gia dinh
- Gia dinh ban
- Anh, Chi, Anh chi, Gia dinh anh chi khi ba me la nguoi dung moi
- Em, Vo chong em, Gia dinh em khi ba me la nguoi dung moi

Vi du:

```text
Gia dinh Thao & Vu den du Thanh Le Hon Phoi & tiec cuoi cua con chung toi.
```

### Khach la chau / lop nho hon

Chu the lay theo cot "Ba me goi co dau chu re la":

- `hai em Nhat & Phuong`
- `hai anh chi Nhat & Phuong`

Vi du:

```text
Chau Nam den du Thanh Le Hon Phoi & tiec cuoi cua hai em Nhat & Phuong.
```

## Khi Nhat & Phuong dung moi

Chu the lay theo cot "Xung ho khi Nhat/Phuong moi", nhung doi `tụi` thanh `chúng` cho trang trong hon tren Hero:

- `tụi mình` -> `chúng mình`
- `tụi em` -> `chúng em`
- `tụi con` -> `chúng con`
- `anh chị` giu nguyen

Vi du:

```text
Hai ban Tung & Huong den du Thanh Le Hon Phoi & tiec cuoi cua chung minh.
Gia dinh Anh Chi Hien & Hong den du Thanh Le Hon Phoi & tiec cuoi cua chung em.
```

