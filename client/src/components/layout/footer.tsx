import { Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">دفعة 2026</h2>
            <p className="text-gray-600 dark:text-gray-400">منصة الملفات التعليمية</p>
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">للتواصل</h3>
            <ul className="text-gray-600 dark:text-gray-400">
              <li className="mb-2">
                <a href="tel:+96566162173" className="hover:text-primary dark:hover:text-primary-light flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  +96566162173
                </a>
              </li>
              <li>
                <a href="mailto:mohamedahmed66972007@gmail.com" className="hover:text-primary dark:hover:text-primary-light flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  mohamedahmed66972007@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            جميع الحقوق محفوظة لصالح محمد أحمد 🙂
          </p>
        </div>
      </div>
    </footer>
  );
}
