# Vòng đời của một Request trong NestJS (Request Lifecycle)

> *"Điểm đáng giá nhất của NestJS không nằm ở chỗ nó giúp bạn viết code nhanh hơn, mà ở chỗ nó buộc bạn viết code có tổ chức."*  
> — Trích sách *NestJS Nền Tảng (Mtikcode)*

---

## 1. Vì sao phải chia tách thành nhiều lớp?

Trong backend, có một quy tắc bất di bất dịch: **không bao giờ tin tưởng client một cách vô điều kiện**. 

Một HTTP request gửi từ client lên server có thể chứa dữ liệu rác, thiếu token, cố tình tấn công bằng cách truyền sai kiểu, hoặc gọi vào tài nguyên mà họ không có quyền xem. Trước khi bắt tay vào xử lý nghiệp vụ, server luôn phải trả lời được 3 câu hỏi:
1. **Người gửi là ai, họ có quyền gọi vào đây không?** *(Authentication & Authorization)*
2. **Dữ liệu họ gửi lên có đúng khuôn mẫu và sạch sẽ không?** *(Validation & Transformation)*
3. **Nếu có lỗi hoặc khi trả kết quả, làm sao để mọi phản hồi đều tuân theo một quy chuẩn thống nhất?** *(Interception & Exception Handling)*

Nếu dùng Express thuần, bạn thường dồn hết các việc này vào `app.use()` hoặc viết lẫn lộn trong route handler. Khi dự án lớn lên, việc bảo trì và viết test trở thành cơn ác mộng.

NestJS giải quyết việc này bằng cách chia vòng đời của một request thành các trạm kiểm soát riêng biệt theo nguyên lý SOLID. Mỗi lớp chỉ làm đúng một nhiệm vụ duy nhất.

---

## 2. Ẩn dụ Sân Bay — Hình dung dây chuyền kiểm soát

Để dễ nhớ thứ tự và vai trò của từng thành phần, hãy hình dung hành trình của một request giống như một hành khách đi máy bay:

```text
[Hành khách đến sân bay] (HTTP Request)
         │
         ▼
[1. Quầy check-in sân bay] ─── MIDDLEWARE
         │  (Ghi nhận hành khách, đóng dấu Request ID, ghi log ban đầu)
         ▼
[2. Cửa an ninh & soát vé] ─── GUARD
         │  (Kiểm tra vé, căn cước, token: Có được phép vào ga không?)
         │  ──> Nếu không có vé / vé giả: Bị đuổi về ngay lập tức!
         ▼
[3. Tiếp viên đón tại cửa máy bay] ─── INTERCEPTOR (Lượt đi)
         │  (Chào đón hành khách, bấm đồng hồ đo thời gian chuyến bay)
         ▼
[4. Máy soi chiếu hành lý xách tay] ─── PIPE
         │  (Kiểm tra đồ đạc gửi kèm có hợp lệ không, ép kiểu dữ liệu sạch)
         │  ──> Nếu hành lý sai luật: Chặn lại, báo lỗi 400!
         ▼
[5. Khoang hành khách & Buồng lái] ─── CONTROLLER & SERVICE
         │  (Chuyến bay cất cánh: xử lý logic nghiệp vụ, lấy dữ liệu)
         ▼
[6. Tiếp viên tiễn khách & trao quà] ─── INTERCEPTOR (Lượt về)
         │  (Chốt thời gian bay, gói quà/định dạng lại dữ liệu trả về cho đẹp)
         ▼
[Hành khách rời máy bay an toàn] ─── HTTP RESPONSE (200 OK)
```

### Vậy còn Exception Filter ở đâu?
**Exception Filter chính là Đội cứu hộ khẩn cấp!**  
Đội cứu hộ không xếp hàng đứng trong lối đi của hành khách bình thường. Họ chỉ xuất hiện khi có sự cố bất ngờ xảy ra (máy bay rung lắc, hành lý phát nổ, hành khách ngất xỉu). 

Khi bất kỳ trạm nào phía trên ném ra lỗi (`throw new HttpException(...)` hoặc code bị crash), **toàn bộ các bước còn lại bị hủy ngay lập tức**, và request nhảy thẳng tới Exception Filter để gói ghém thông tin lỗi an toàn trả về cho client.

---

## 3. Thứ tự thực thi chuẩn xác

Trong NestJS, thứ tự thực thi chính thức từ khi request chạm vào server cho đến khi response bay ra ngoài như sau:

$$\text{Incoming Request}$$
$$\downarrow$$
$$\mathbf{1.\ Middleware}$$
$$\downarrow$$
$$\mathbf{2.\ Guard}$$
$$\downarrow$$
$$\mathbf{3.\ Interceptor\ (Giai\ đoạn\ Pre-controller)}$$
$$\downarrow$$
$$\mathbf{4.\ Pipe}$$
$$\downarrow$$
$$\mathbf{5.\ Controller\ (Route\ Handler)}$$
$$\downarrow$$
$$\mathbf{6.\ Service\ (Logic\ nghiệp\ vụ)}$$
$$\downarrow$$
$$\mathbf{7.\ Interceptor\ (Giai\ đoạn\ Post-controller\ qua\ RxJS\ Observable)}$$
$$\downarrow$$
$$\text{Outgoing Response}$$

$$\Big\Downarrow \text{(Nếu phát sinh Exception bất kỳ lúc nào)}$$
$$\mathbf{8.\ Exception\ Filter}$$

---

## 4. Chi tiết 3 thành phần cốt lõi trong Lab

### 4.1. Guard — Người gác cổng (CanActivate)
* **Vị trí:** Chạy ngay sau Middleware, nhưng **trước** Interceptor và Pipe.
* **Nhiệm vụ:** Trả lời câu hỏi: *"Request này có được phép đi tiếp không?"*.
* **Hàm cốt lõi:**
  ```typescript
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>
  ```
* **Đặc tính then chốt:**
  * Nếu trả về `true`: Request được phép đi tiếp tới Interceptor và Pipe.
  * Nếu ném `UnauthorizedException` hoặc trả về `false`: Request bị ngắt ngay lập tức, chuyển thẳng tới Exception Filter. **Các Interceptor và Controller phía sau sẽ không bao giờ được kích hoạt.**

### 4.2. Interceptor — Người đồng hành hai chiều (NestInterceptor)
* **Vị trí:** Bọc cả hai đầu của Controller (trước và sau khi Route Handler chạy).
* **Nhiệm vụ:** Đo thời gian xử lý, ghi log request/response, cache dữ liệu hoặc biến đổi cấu trúc response.
* **Cơ chế hoạt động với RxJS:**
  ```typescript
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 1. LƯỢT ĐI (Pre-controller): Chạy trước khi Controller nhận request
    const startTime = Date.now();

    return next.handle().pipe(
      // 2. LƯỢT VỀ (Post-controller): Chạy sau khi Controller đã trả dữ liệu
      tap(() => {
        // tap dùng để quan sát (side-effect), KHÔNG thay đổi dữ liệu
        const duration = Date.now() - startTime;
        console.log(`Thời gian xử lý: ${duration}ms`);
      }),
      map((data) => {
        // map dùng để BIẾN ĐỔI dữ liệu trước khi gửi ra cho client
        return {
          success: true,
          statusCode: 200,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
  ```

> [!NOTE]
> **Phân biệt `tap()` và `map()`:**
> * `tap()`: Dùng để "nghe lén" dữ liệu đi qua mà **không sửa đổi** nó. Rất phù hợp để ghi log, đo thời gian hoặc đẩy số liệu thống kê.
> * `map()`: Dùng để **biến đổi hình dạng** dữ liệu. Bất kỳ giá trị nào bạn trả về từ callback của `map()` sẽ trở thành body phản hồi thực tế mà client nhận được.

### 4.3. Exception Filter — Người cứu hộ (ExceptionFilter)
* **Vị trí:** Chỉ kích hoạt khi có unhandled exception phát sinh.
* **Nhiệm vụ:** Ngăn ngừa việc server bị crash, chuẩn hóa cấu trúc JSON thông báo lỗi và ẩn các thông tin nhạy cảm.
* **Tại sao không nên để mặc định?**  
  Nếu bạn `throw new Error("Lỗi kết nối database")`, NestJS mặc định sẽ trả về status 500 kèm toàn bộ stack trace (tên file, số dòng code). Kẻ xấu có thể dựa vào đó để khai thác lỗ hổng.  
  Exception Filter sẽ chặn đứng rò rỉ này: nó ghi chi tiết lỗi vào log server để lập trình viên sửa, nhưng chỉ gửi về client một thông báo an toàn kèm mã lỗi ngắn gọn.

---

## 5. Câu hỏi ôn tập nhanh

**Câu 1:** Một request bị Custom Guard từ chối (ném `UnauthorizedException`). Điều gì sẽ xảy ra tiếp theo?  
A. Request vẫn đi tiếp qua Interceptor để đo thời gian, rồi mới báo lỗi.  
B. Request đi thẳng tới Exception Filter; Interceptor và Controller không được thực thi.  
C. Request bị treo cho tới khi timeout.  
D. Pipe sẽ kiểm tra dữ liệu trước khi trả về lỗi.  

**Câu 2:** Để đo thời gian thực thi của một route mà không làm thay đổi dữ liệu trả về, bạn nên sử dụng toán tử RxJS nào trong Interceptor?  
A. `map()`  
B. `filter()`  
C. `tap()`  
D. `switchMap()`  

> **Đáp án:**  
> 1 — **B** (Guard chặn sớm nhất trước Interceptor và Pipe; khi Guard từ chối, luồng rẽ nhánh ngay sang Exception Filter).  
> 2 — **C** (`tap` chỉ thực hiện side-effect ghi log/đo giờ mà không làm biến đổi dữ liệu, trong khi `map` dùng để định hình lại dữ liệu).
