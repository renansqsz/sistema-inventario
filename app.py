from __future__ import annotations

from datetime import date
from typing import Any

import pandas as pd
import streamlit as st

from python_app import services


st.set_page_config(
    page_title="Sistema de Inventario em Python",
    layout="wide",
    initial_sidebar_state="expanded",
)


NOTEBOOK_CONDITIONS = ["Novo", "Bom", "Razoavel", "Com Defeito"]
NOTEBOOK_STATUSES = ["Em Estoque", "Em Uso", "Manutencao"]
STORAGE_TYPES = ["SSD", "HD", "NVMe", "SSD + HD"]
EMPLOYEE_OFFICE_OPTIONS = ["CampSoft", "Tocalivros"]
MENU_ITEMS = [
    {"page": "Dashboard", "label": "🖥️  Dashboard"},
    {"page": "Equipamentos", "label": "🧰  Equipamentos"},
    {"page": "Notebooks", "label": "💻  Notebooks"},
    {"page": "Categorias", "label": "🗂️  Categorias"},
    {"page": "Colaboradores", "label": "👥  Colaboradores"},
]


def inject_styles() -> None:
    st.markdown(
        """
        <style>
        .block-container {
            padding-top: 1.5rem;
            padding-bottom: 2rem;
        }
        .metric-card {
            background: linear-gradient(135deg, #ffffff, #eef2ff);
            border: 1px solid rgba(79, 70, 229, 0.12);
            border-radius: 16px;
            padding: 1rem 1rem 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
            min-height: 130px;
            height: 130px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .metric-card-label {
            color: #6b7280;
            font-size: 0.86rem;
            font-weight: 600;
            margin-bottom: 0.45rem;
        }
        .metric-card-value {
            color: #111827;
            font-size: 1.9rem;
            font-weight: 800;
            letter-spacing: -0.04em;
        }
        .news-card {
            border: 1px solid rgba(148, 163, 184, 0.24);
            border-radius: 18px;
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
            min-height: 100%;
            display: flex;
            flex-direction: column;
        }
        .news-card [data-testid="stImage"] img {
            width: 100%;
            height: 220px !important;
            object-fit: cover;
        }
        .news-card-body {
            padding: 1rem 1rem 1.2rem;
            min-height: 180px;
        }
        .news-tag {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 999px;
            background: rgba(29, 78, 216, 0.1);
            color: #1d4ed8;
            font-size: 0.74rem;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 0.75rem;
        }
        .news-title {
            font-size: 1.05rem;
            font-weight: 800;
            color: #111827;
            margin-bottom: 0.55rem;
        }
        .news-description {
            color: #4b5563;
            font-size: 0.92rem;
            line-height: 1.55;
            min-height: 84px;
        }
        .sidebar-brand {
            display: flex;
            justify-content: center;
            margin: 0.8rem 0 1.1rem;
        }
        .sidebar-brand a {
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 86px;
            height: 64px;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(29, 78, 216, 0.18));
            border: 1px solid rgba(59, 130, 246, 0.16);
        }
        .sidebar-brand span {
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: -0.14em;
            background: linear-gradient(135deg, #22d3ee, #1d4ed8);
            -webkit-background-clip: text;
            color: transparent;
            font-family: Arial, sans-serif;
        }
        [data-testid="stSidebar"] h1 {
            text-align: center;
            width: 100%;
        }
        .sidebar-menu-title {
            color: #6b7280;
            font-size: 0.82rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin: 0.35rem 0 0.55rem;
            text-align: left;
            width: 100%;
        }
        [data-testid="stSidebar"] .stButton > button {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            text-align: left;
            border-radius: 12px;
            padding: 0.72rem 0.85rem;
            border: 1px solid transparent;
            background: transparent;
            color: #6b7280;
            font-weight: 600;
            box-shadow: none;
            font-size: 1rem;
            line-height: 1.2;
        }
        [data-testid="stSidebar"] .stButton > button > div,
        [data-testid="stSidebar"] .stButton > button > div > div {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            text-align: left;
        }
        [data-testid="stSidebar"] .stButton > button:hover {
            background: rgba(79, 70, 229, 0.08);
            color: #312e81;
            border-color: rgba(79, 70, 229, 0.16);
        }
        [data-testid="stSidebar"] .stButton > button[kind="primary"] {
            background: linear-gradient(135deg, #4f46e5, #4338ca);
            color: white;
            border-color: rgba(79, 70, 229, 0.3);
            box-shadow: 0 10px 18px rgba(79, 70, 229, 0.18);
        }
        [data-testid="stSidebar"] .stButton > button[kind="primary"]:hover {
            background: linear-gradient(135deg, #4338ca, #3730a3);
            color: white;
        }
        [data-testid="stSidebar"] .stButton > button p {
            text-align: left;
            width: 100%;
            margin: 0;
            justify-content: flex-start;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def init_session() -> None:
    services.init_db()
    st.session_state.setdefault("auth_user", None)
    st.session_state.setdefault("current_page", "Dashboard")


def format_public_date(value: str) -> str:
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return date.today().strftime("%d/%m/%Y")
    return parsed.strftime("%d/%m/%Y")


def filter_items(
    items: list[dict[str, Any]],
    search: str,
    status_key: str | None = None,
    status_value: str = "Todos",
) -> list[dict[str, Any]]:
    filtered = items
    search = search.strip().lower()

    if status_key and status_value != "Todos":
        filtered = [item for item in filtered if str(item.get(status_key, "")) == status_value]

    if search:
        filtered = [
            item
            for item in filtered
            if search in " ".join(str(value).lower() for value in item.values())
        ]

    return filtered


def build_dataframe(items: list[dict[str, Any]], rename_map: dict[str, str], columns: list[str]) -> pd.DataFrame:
    if not items:
        return pd.DataFrame(columns=[rename_map[column] for column in columns])
    dataframe = pd.DataFrame(items)
    dataframe = dataframe[columns].rename(columns=rename_map)
    return dataframe


def show_login() -> None:
    left, center, right = st.columns([1.2, 1, 1.2])
    with center:
        st.markdown("## Sistema de Inventario em Python")
        st.caption("Versao reescrita em Streamlit usando o mesmo SQLite.")
        with st.form("login_form", clear_on_submit=False):
            username = st.text_input("Usuario")
            password = st.text_input("Senha", type="password")
            submitted = st.form_submit_button("Entrar", use_container_width=True)

        if submitted:
            user = services.verify_user(username, password)
            if not user:
                st.error("Usuario ou senha invalidos.")
            else:
                st.session_state["auth_user"] = user
                st.rerun()

        st.info("Usuario padrao: admin | Senha padrao: admin123")


@st.cache_data(ttl=900, show_spinner=False)
def load_news() -> list[dict[str, Any]]:
    return services.fetch_ai_news(limit=3)


def render_sidebar() -> str:
    with st.sidebar:
        st.title("Dashboard - TI")
        st.markdown(
            '<div class="sidebar-brand"><a href="https://big-big.streamlit.app/" target="_blank"><span>BB</span></a></div>',
            unsafe_allow_html=True,
        )
        st.markdown('<div class="sidebar-menu-title">Menu</div>', unsafe_allow_html=True)
        for item in MENU_ITEMS:
            is_active = st.session_state["current_page"] == item["page"]
            if st.button(
                item["label"],
                key=f"menu_{item['page']}",
                use_container_width=True,
                type="primary" if is_active else "secondary",
            ):
                st.session_state["current_page"] = item["page"]
                st.rerun()

        st.divider()
        if st.button("Sair", use_container_width=True):
            st.session_state["auth_user"] = None
            st.rerun()
    return st.session_state["current_page"]


def render_dashboard() -> None:
    st.title("Dashboard")
    stats = services.get_dashboard_stats()
    metric_specs = [
        ("Equipamentos (Tipos)", stats["totalItems"]),
        ("Em Estoque (Tipos)", stats["inStock"]),
        ("Em Falta", stats["outOfStock"]),
        ("Colaboradores", stats["totalEmployees"]),
        ("Notebooks", stats["totalNotebooks"]),
        ("Itens Alocados", stats["assignedItems"]),
    ]

    columns = st.columns(6)
    for column, (label, value) in zip(columns, metric_specs):
        with column:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-card-label">{label}</div>
                    <div class="metric-card-value">{value}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.subheader("Informativos & Novidades")
    news_columns = st.columns(3)
    for column, item in zip(news_columns, load_news()):
        with column:
            st.markdown('<div class="news-card">', unsafe_allow_html=True)
            st.image(item["image"], use_container_width=True)
            st.markdown(
                f"""
                <div class="news-card-body">
                    <div class="news-tag">{item["category"]}</div>
                    <div class="news-title">{item["title"]}</div>
                    <div class="news-description">{item["description"]}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            st.caption(format_public_date(item["pubDate"]))
            st.link_button("Ler mais", item["link"], use_container_width=True)
            st.markdown("</div>", unsafe_allow_html=True)


def render_equipments() -> None:
    st.title("Equipamentos")
    equipments = services.list_equipments()

    search_column, status_column = st.columns([2, 1])
    with search_column:
        search = st.text_input("Buscar por nome, categoria ou numero de serie", key="equipment_search")
    with status_column:
        status_filter = st.selectbox("Status", ["Todos", "Em estoque", "Em falta"], key="equipment_status")

    filtered = filter_items(equipments, search, "status", status_filter)
    equipment_table = build_dataframe(
        filtered,
        {
            "id": "ID",
            "name": "Nome",
            "category": "Categoria",
            "totalQuantity": "Qtd. Total",
            "availableQuantity": "Qtd. Disponivel",
            "status": "Status",
            "location": "Localizacao",
        },
        ["id", "name", "category", "totalQuantity", "availableQuantity", "status", "location"],
    )
    st.dataframe(equipment_table, use_container_width=True, hide_index=True)

    manage_tab, assign_tab, history_tab, export_tab = st.tabs(
        ["Cadastrar / Editar", "Atribuir", "Historico", "Exportar"]
    )

    with manage_tab:
        categories = [item["name"] for item in services.list_categories()]
        selected_equipment = st.selectbox(
            "Selecionar equipamento para editar",
            [None] + equipments,
            format_func=lambda item: "Novo equipamento" if item is None else f"#{item['id']} - {item['name']}",
            key="equipment_editor_select",
        )
        current = selected_equipment or {
            "name": "",
            "category": categories[0] if categories else "Outros",
            "brand": "",
            "model": "",
            "serialNumber": "",
            "totalQuantity": 0,
            "availableQuantity": 0,
            "location": "",
            "entryDate": date.today().isoformat(),
        }

        with st.form("equipment_form"):
            name = st.text_input("Nome do produto", value=current["name"])
            left, right = st.columns(2)
            with left:
                category = st.selectbox(
                    "Categoria",
                    categories or ["Outros"],
                    index=(categories.index(current["category"]) if current["category"] in categories else 0),
                )
                brand = st.text_input("Marca", value=current["brand"] or "")
                total_quantity = st.number_input("Quantidade total", min_value=0, value=int(current["totalQuantity"]))
            with right:
                entry_date = st.date_input("Data de entrada", value=services.parse_iso_date(current["entryDate"]))
                model = st.text_input("Modelo", value=current["model"] or "")
                available_quantity = st.number_input(
                    "Quantidade disponivel",
                    min_value=0,
                    value=int(current["availableQuantity"]),
                )
            serial_number = st.text_input("Numero de serie", value=current["serialNumber"] or "")
            location = st.text_input("Localizacao", value=current["location"] or "")
            submitted = st.form_submit_button("Salvar equipamento")

        if submitted:
            try:
                payload = {
                    "id": current.get("id"),
                    "name": name,
                    "category": category,
                    "brand": brand,
                    "model": model,
                    "serialNumber": serial_number,
                    "totalQuantity": int(total_quantity),
                    "availableQuantity": int(available_quantity),
                    "location": location,
                    "entryDate": entry_date.isoformat(),
                }
                services.upsert_equipment(payload)
                st.success("Equipamento salvo com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

        if selected_equipment and st.button("Excluir equipamento selecionado", key="equipment_delete"):
            try:
                services.delete_equipment(selected_equipment["id"])
                st.success("Equipamento excluido com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

    with assign_tab:
        employees = services.list_employees()
        offices = services.list_offices()
        if not equipments or not employees:
            st.info("Cadastre equipamentos e colaboradores antes de fazer atribuicoes.")
        else:
            office = st.selectbox("Escritorio", offices, key="assign_office")
            employees_for_office = [employee for employee in employees if employee["escritorio"] == office]
            with st.form("assignment_form"):
                equipment = st.selectbox(
                    "Equipamento",
                    equipments,
                    format_func=lambda item: f"#{item['id']} - {item['name']} | {item['category']} | disponivel: {item['availableQuantity']}",
                )
                quantity = st.number_input("Quantidade", min_value=1, value=1)
                employee = st.selectbox(
                    "Funcionario",
                    employees_for_office,
                    format_func=lambda item: item["nome"],
                )
                assign_submitted = st.form_submit_button("Confirmar atribuicao")

            st.write(
                f"Disponivel: `{equipment['availableQuantity']}` | Localizacao: `{equipment['location']}`"
            )
            if assign_submitted:
                try:
                    services.assign_equipment(
                        equipment_id=equipment["id"],
                        employee_id=employee["id"],
                        quantity=int(quantity),
                        office=office,
                    )
                    st.success("Atribuicao realizada com sucesso.")
                    st.rerun()
                except ValueError as error:
                    st.error(str(error))

    with history_tab:
        if not equipments:
            st.info("Nenhum equipamento cadastrado.")
        else:
            history_equipment = st.selectbox(
                "Equipamento para historico",
                equipments,
                format_func=lambda item: f"#{item['id']} - {item['name']}",
                key="history_equipment_select",
            )
            history = services.get_equipment_history(history_equipment["id"])
            if history:
                history_table = build_dataframe(
                    history,
                    {
                        "equipmentName": "Equipamento",
                        "employeeName": "Funcionario",
                        "office": "Escritorio",
                        "quantity": "Quantidade",
                        "movementType": "Movimento",
                        "createdAt": "Criado em",
                    },
                    ["equipmentName", "employeeName", "office", "quantity", "movementType", "createdAt"],
                )
                st.dataframe(history_table, use_container_width=True, hide_index=True)
            else:
                st.info("Nenhum historico encontrado para este equipamento.")

    with export_tab:
        st.download_button(
            "Baixar inventario em Excel",
            data=services.export_equipments_report(),
            file_name="inventario_ti_python.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )


def render_notebooks() -> None:
    st.title("Notebooks")
    notebooks = services.list_notebooks()
    notebook_status_options = sorted(
        {
            status
            for status in NOTEBOOK_STATUSES
            + [str(notebook.get("status", "")).strip() for notebook in notebooks]
            if status
        }
    )

    search_column, status_column = st.columns([2, 1])
    with search_column:
        search = st.text_input("Buscar por marca, modelo ou numero de serie", key="notebook_search")
    with status_column:
        status_filter = st.selectbox("Status", ["Todos"] + notebook_status_options, key="notebook_status")

    filtered = filter_items(notebooks, search, "status", status_filter)
    notebook_table = build_dataframe(
        filtered,
        {
            "id": "ID",
            "brand": "Marca",
            "model": "Modelo",
            "serialNumber": "Numero de Serie",
            "processor": "Processador",
            "ramTotal": "RAM",
            "status": "Status",
        },
        ["id", "brand", "model", "serialNumber", "processor", "ramTotal", "status"],
    )
    st.dataframe(notebook_table, use_container_width=True, hide_index=True)

    manage_tab, export_tab = st.tabs(["Cadastrar / Editar", "Exportar"])

    with manage_tab:
        selected_notebook = st.selectbox(
            "Selecionar notebook para editar",
            [None] + notebooks,
            format_func=lambda item: "Novo notebook" if item is None else f"#{item['id']} - {item['brand']} {item['model']}",
            key="notebook_editor_select",
        )
        current = selected_notebook or {
            "brand": "",
            "model": "",
            "serialNumber": "",
            "processor": "",
            "gpu": "",
            "screenSize": "",
            "ramTotal": 8,
            "ramSticks": 1,
            "storageType": "SSD",
            "storageCapacity": "",
            "condition": "Novo",
            "location": "",
            "status": "Em Estoque",
            "entryDate": date.today().isoformat(),
        }
        condition_options = list(dict.fromkeys([current["condition"]] + NOTEBOOK_CONDITIONS))
        storage_options = list(dict.fromkeys([current["storageType"]] + STORAGE_TYPES))
        status_options = list(dict.fromkeys([current["status"]] + notebook_status_options))

        with st.form("notebook_form"):
            brand = st.text_input("Marca", value=current["brand"])
            model = st.text_input("Modelo", value=current["model"])
            serial_number = st.text_input("Numero de serie / Service Tag", value=current["serialNumber"] or "")
            processor = st.text_input("Processador", value=current["processor"] or "")
            left, right = st.columns(2)
            with left:
                gpu = st.text_input("Placa de video", value=current["gpu"] or "")
                ram_total = st.number_input("RAM total (GB)", min_value=1, value=int(current["ramTotal"]))
                storage_type = st.selectbox(
                    "Tipo de armazenamento",
                    storage_options,
                    index=storage_options.index(current["storageType"]) if current["storageType"] in storage_options else 0,
                )
                condition = st.selectbox(
                    "Condicao",
                    condition_options,
                    index=condition_options.index(current["condition"]) if current["condition"] in condition_options else 0,
                )
            with right:
                screen_size = st.text_input("Tela", value=current["screenSize"] or "")
                ram_sticks = st.number_input("Qtd. de pentes RAM", min_value=1, value=int(current["ramSticks"]))
                storage_capacity = st.text_input("Capacidade do armazenamento", value=current["storageCapacity"] or "")
                status = st.selectbox(
                    "Status",
                    status_options,
                    index=status_options.index(current["status"]) if current["status"] in status_options else 0,
                )
            location = st.text_input("Localizacao", value=current["location"] or "")
            entry_date = st.date_input("Data de entrada", value=services.parse_iso_date(current["entryDate"]))
            submitted = st.form_submit_button("Salvar notebook")

        if submitted:
            try:
                payload = {
                    "id": current.get("id"),
                    "brand": brand,
                    "model": model,
                    "serialNumber": serial_number,
                    "processor": processor,
                    "gpu": gpu,
                    "screenSize": screen_size,
                    "ramTotal": int(ram_total),
                    "ramSticks": int(ram_sticks),
                    "storageType": storage_type,
                    "storageCapacity": storage_capacity,
                    "condition": condition,
                    "location": location,
                    "status": status,
                    "entryDate": entry_date.isoformat(),
                }
                services.upsert_notebook(payload)
                st.success("Notebook salvo com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

        if selected_notebook and st.button("Excluir notebook selecionado", key="notebook_delete"):
            try:
                services.delete_notebook(selected_notebook["id"])
                st.success("Notebook excluido com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

    with export_tab:
        st.download_button(
            "Baixar relatorio de notebooks",
            data=services.export_notebooks_report(),
            file_name="inventario_notebooks_python.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )


def render_categories() -> None:
    st.title("Categorias")
    categories = services.list_categories()
    category_table = build_dataframe(
        categories,
        {"id": "ID", "name": "Nome da Categoria"},
        ["id", "name"],
    )
    st.dataframe(category_table, use_container_width=True, hide_index=True)

    add_column, delete_column = st.columns(2)
    with add_column:
        with st.form("category_form"):
            category_name = st.text_input("Nova categoria")
            add_submitted = st.form_submit_button("Adicionar categoria")
        if add_submitted:
            try:
                services.create_category(category_name)
                st.success("Categoria criada com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

    with delete_column:
        if categories:
            selected_category = st.selectbox(
                "Categoria para excluir",
                categories,
                format_func=lambda item: f"#{item['id']} - {item['name']}",
            )
            if st.button("Excluir categoria selecionada"):
                try:
                    services.delete_category(selected_category["id"])
                    st.success("Categoria excluida com sucesso.")
                    st.rerun()
                except ValueError as error:
                    st.error(str(error))


def render_employees() -> None:
    st.title("Colaboradores")
    employees = services.list_employees_with_assignments()
    offices = sorted({employee["escritorio"] for employee in employees} | set(EMPLOYEE_OFFICE_OPTIONS))

    search_column, office_column = st.columns([2, 1])
    with search_column:
        search = st.text_input("Buscar por nome ou escritorio", key="employee_search")
    with office_column:
        office_filter = st.selectbox("Escritorio", ["Todos"] + offices, key="employee_office")

    filtered = employees
    if office_filter != "Todos":
        filtered = [employee for employee in filtered if employee["escritorio"] == office_filter]
    if search.strip():
        lower_search = search.strip().lower()
        filtered = [
            employee
            for employee in filtered
            if lower_search in employee["nome"].lower() or lower_search in employee["escritorio"].lower()
        ]

    employee_rows = [
        {
            "id": employee["id"],
            "nome": employee["nome"],
            "escritorio": employee["escritorio"],
            "itensAtribuidos": sum(int(item["quantity"]) for item in employee["items"]),
        }
        for employee in filtered
    ]
    employee_table = build_dataframe(
        employee_rows,
        {"id": "ID", "nome": "Nome", "escritorio": "Escritorio", "itensAtribuidos": "Itens Atribuidos"},
        ["id", "nome", "escritorio", "itensAtribuidos"],
    )
    st.dataframe(employee_table, use_container_width=True, hide_index=True)

    manage_tab, details_tab, export_tab = st.tabs(["Cadastrar / Editar", "Detalhes e Devolucoes", "Exportar"])

    with manage_tab:
        base_employees = services.list_employees()
        selected_employee = st.selectbox(
            "Selecionar colaborador para editar",
            [None] + base_employees,
            format_func=lambda item: "Novo colaborador" if item is None else f"#{item['id']} - {item['nome']}",
            key="employee_editor_select",
        )
        current = selected_employee or {"nome": "", "escritorio": offices[0] if offices else EMPLOYEE_OFFICE_OPTIONS[0]}

        with st.form("employee_form"):
            nome = st.text_input("Nome completo", value=current["nome"])
            escritorio = st.selectbox(
                "Escritorio",
                offices,
                index=offices.index(current["escritorio"]) if current["escritorio"] in offices else 0,
            )
            submitted = st.form_submit_button("Salvar colaborador")

        if submitted:
            try:
                services.upsert_employee(
                    {"id": current.get("id"), "nome": nome, "escritorio": escritorio}
                )
                st.success("Colaborador salvo com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

        if selected_employee and st.button("Excluir colaborador selecionado", key="employee_delete"):
            try:
                services.delete_employee(selected_employee["id"])
                st.success("Colaborador excluido com sucesso.")
                st.rerun()
            except ValueError as error:
                st.error(str(error))

    with details_tab:
        if not filtered:
            st.info("Nenhum colaborador disponivel com os filtros atuais.")
        else:
            selected_details = st.selectbox(
                "Selecionar colaborador",
                filtered,
                format_func=lambda item: f"#{item['id']} - {item['nome']} | {item['escritorio']}",
                key="employee_details_select",
            )
            st.write(f"Escritorio: `{selected_details['escritorio']}`")
            details_rows = [
                {
                    "name": item["name"],
                    "quantity": item["quantity"],
                    "equipmentId": item["equipmentId"],
                }
                for item in selected_details["items"]
            ]
            details_table = build_dataframe(
                details_rows,
                {"name": "Item", "quantity": "Quantidade", "equipmentId": "Equipamento ID"},
                ["name", "quantity", "equipmentId"],
            )
            st.dataframe(details_table, use_container_width=True, hide_index=True)

            if selected_details["items"]:
                item = st.selectbox(
                    "Item para desatribuir",
                    selected_details["items"],
                    format_func=lambda value: f"{value['name']} | quantidade atual: {value['quantity']}",
                    key="employee_item_unassign",
                )
                quantity = st.number_input(
                    "Quantidade para devolver",
                    min_value=1,
                    max_value=int(item["quantity"]),
                    value=1,
                    key="employee_item_unassign_quantity",
                )
                action_left, action_right = st.columns(2)
                with action_left:
                    if st.button("Desatribuir item", use_container_width=True):
                        try:
                            services.unassign_item(
                                employee_id=selected_details["id"],
                                equipment_id=item["equipmentId"],
                                quantity=int(quantity),
                            )
                            st.success("Item desatribuido com sucesso.")
                            st.rerun()
                        except ValueError as error:
                            st.error(str(error))
                with action_right:
                    if st.button("Desatribuir tudo", use_container_width=True):
                        services.unassign_all(selected_details["id"])
                        st.success("Todos os itens foram desatribuidos.")
                        st.rerun()
            else:
                st.info("Nenhum item atribuido a este colaborador.")

    with export_tab:
        st.download_button(
            "Baixar relatorio de colaboradores",
            data=services.export_employees_report(),
            file_name="colaboradores_python.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )


def main() -> None:
    inject_styles()
    init_session()

    if not st.session_state["auth_user"]:
        show_login()
        return

    page = render_sidebar()
    if page == "Dashboard":
        render_dashboard()
    elif page == "Equipamentos":
        render_equipments()
    elif page == "Notebooks":
        render_notebooks()
    elif page == "Categorias":
        render_categories()
    elif page == "Colaboradores":
        render_employees()


if __name__ == "__main__":
    main()
