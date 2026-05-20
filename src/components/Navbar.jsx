export default function Navbar({ title }) {
    return (
        <div className="topbar">
            <div>
                <h2>{title}</h2>
                <p>Enterprise Expense Management System</p>
            </div>
        </div>
    );
}