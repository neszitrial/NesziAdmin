export function showToast(message, icon = "success") {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: icon,
    title: message,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    background: "#fff",
    color: "#333",
    customClass: {
      popup: "swal2-toast",
      title: "swal2-title",
    },
    showClass: { popup: "animate__animated animate__fadeInDown" },
    hideClass: { popup: "animate__animated animate__fadeOutUp" },
  });
}
